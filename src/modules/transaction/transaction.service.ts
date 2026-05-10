import { CreateTransactionsDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transactions, TransactionsDocument } from './schemas/transaction.schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { TransactionItems, TransactionItemsDocument } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsDocument } from '../dues-periods/schemas/dues-periods.schema';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transactions.name) private transactionModel: Model<TransactionsDocument>,
    @InjectModel(TransactionItems.name) private transactionItemsModel: Model<TransactionItemsDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async findAll() {
    return this.transactionModel.find().exec();
  }

  async export(month: number, year: number) {
    const matchStage: any = { 'period.year': year };
    if (month > 0) {
      matchStage['period.month'] = month;
    }

    
    const transactions = await this.transactionModel.aggregate([
      {
        $lookup: {
          from: 'transactionitems',
          localField: '_id',
          foreignField: 'transaction_id',
          as: 'items',
        },
      },
      { $unwind: '$items' },

      // convert string period_id to ObjectId before lookup
      {
        $addFields: {
          'items.period_id_obj': {
            $toObjectId: '$items.period_id',
          },
        },
      },

      {
        $lookup: {
          from: 'duesperiods',
          localField: 'items.period_id_obj',
          foreignField: '_id',
          as: 'period',
        },
      },
      { $unwind: '$period' },

      {
        $match: matchStage ,
      },

      // same for anggota_id
      {
        $addFields: {
          'items.anggota_id_obj': {
            $toObjectId: '$items.anggota_id',
          },
        },
      },

      {
        $lookup: {
          from: 'users',
          localField: 'items.anggota_id_obj',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },

      {
        $project: {
          transaction_id: '$_id',
          created_at: 1,
          total_amount: 1,
          status: 1,
          member_name: '$member.fullname',
          npa: '$member.npa',
          period_month: '$period.month',
          period_year: '$period.year',
          item_status: '$items.status',
        },
      },
    ]);

    const totalAmount = transactions.reduce(
      (acc, item) => acc + (item.total_amount ?? 0),
      0,
    );

    return {
      meta: {
        month,
        year,
        generated_at: new Date(),
        total_transactions: transactions.length,
      },
      summary: {
        total_amount: totalAmount,
        distribution: {
          pj: { percentage: 30, amount: totalAmount * 0.30 },
          pc: { percentage: 20, amount: totalAmount * 0.20 },
          pd: { percentage: 20, amount: totalAmount * 0.20 },
          pw: { percentage: 15, amount: totalAmount * 0.15 },
          pp: { percentage: 15, amount: totalAmount * 0.15 },
        },
      },
      data: transactions,
    };
  }
  
  async findOne(id: string): Promise<TransactionsDocument> {
    const doc = this.transactionModel
    .findById(id)
    .populate({
      path: 'transaction_items',
      populate: [
        { path: 'anggota_id' },
        { path: 'period_id' },
      ],
    })
    .lean();
    if (!doc) throw new NotFoundException('Transaction not found');
    return doc;
  }

  async create(payload: CreateTransactionsDto): Promise<any> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const { items, ...transactionData } = payload;

      const created = await this.transactionModel.create(
        [transactionData as any],
        { session }
      );
      const newTransaction = created[0] as TransactionsDocument;

      const itemsWithHeaderId = items.map(item => ({
        ...item,
        transaction_id: newTransaction._id,
      }));

      const createdItems = await this.transactionItemsModel.create(
        itemsWithHeaderId as any[],
        { session, ordered: true }
      );

      await session.commitTransaction();
      const result = newTransaction.toObject();
      return { ...result, items: createdItems };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(id: string, payload: UpdateTransactionDto): Promise<TransactionsDocument> {
    const updated = await this.transactionModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Transaction not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.transactionModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Transaction not found');
    return { deleted: true };
  }
}
