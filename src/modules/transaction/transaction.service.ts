import { CreateTransactionsDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transactions, TransactionsDocument } from './schemas/transaction.schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { TransactionItems, TransactionItemsDocument } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsDocument } from '../dues-periods/schemas/dues-periods.schema';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transactions.name) private transactionModel: Model<TransactionsDocument>,
    @InjectModel(TransactionItems.name) private transactionItemsModel: Model<TransactionItemsDocument>,
    @InjectModel(DuesPeriods.name) private duesPeriodsModel: Model<DuesPeriodsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
  ) { }

  async findAll() {
    return this.transactionModel.find().exec();
  }

  async export(month: number, year: number, regionId?: string) {
    const periodMatch: any = { 'period.year': year };
    if (month > 0) {
      periodMatch['period.month'] = month;
    }

    const pipeline: any[] = [
      {
        $addFields: {
          period_id_obj: { $toObjectId: '$period_id' },
        },
      },
      {
        $lookup: {
          from: 'duesperiods',
          localField: 'period_id_obj',
          foreignField: '_id',
          as: 'period',
        },
      },
      { $unwind: '$period' },
      { $match: periodMatch },
      {
        $addFields: {
          anggota_id_obj: { $toObjectId: '$anggota_id' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'anggota_id_obj',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },
      ...(regionId ? [{ $match: { 'member.region_id': new Types.ObjectId(regionId) } }] : []),
      {
        $lookup: {
          from: 'transactions',
          localField: 'transaction_id',
          foreignField: '_id',
          as: 'transaction',
        },
      },
      { $unwind: { path: '$transaction', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          transaction_id: 1,
          created_at: '$transaction.created_at',
          amount: '$period.amount',
          status: '$status',
          member_name: '$member.fullname',
          npa: '$member.npa',
          period_month: '$period.month',
          period_year: '$period.year',
          item_status: '$status',
        },
      },
    ];
    const items = await this.transactionItemsModel.aggregate(pipeline);

    const totalAmount = items.reduce(
      (acc, item) => acc + (item.amount ?? 0),
      0,
    );

    return {
      meta: {
        month,
        year,
        generated_at: new Date(),
        total_transactions: items.length,
        ...(regionId ? { region_id: regionId } : {}),
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
      data: items,
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

  async getMembersPaymentStatus(year: number, month?: number, regionId?: string) {
    const periodQuery: any = { year, is_active: true };
    if (month && month > 0) {
      periodQuery.month = month;
    }

    const periods = await this.duesPeriodsModel
      .find(periodQuery)
      .sort({ month: 1 })
      .lean();

    const userQuery: any = {};
    if (regionId) userQuery.region_id = new Types.ObjectId(regionId);

    const members = await this.userModel
      .find(userQuery)
      .select('_id fullname npa region_id role')
      .lean();

    const memberIds = members.map((m) => m._id);
    const periodIds = periods.map((p) => p._id);

    const items = await this.transactionItemsModel
      .find({
        anggota_id: { $in: memberIds },
        period_id: { $in: periodIds },
      })
      .lean();

    const itemMap = new Map<string, any>();
    for (const item of items) {
      const key = `${item.anggota_id}-${item.period_id}`;
      itemMap.set(key, item);
    }

    const now = new Date();
    const membersWithPayments = members.map((member) => {
      const payments = periods.map((period) => {
        const key = `${member._id}-${period._id}`;
        const item = itemMap.get(key);

        let status: 'paid' | 'tunggakan' | 'pending';
        if (item?.status === 'paid') {
          status = 'paid';
        } else if (
          period.year < now.getFullYear() ||
          (period.year === now.getFullYear() && period.month < now.getMonth() + 1)
        ) {
          status = 'tunggakan';
        } else {
          status = 'pending';
        }

        return {
          month: period.month,
          year: period.year,
          period_id: period._id,
          amount: period.amount,
          status,
          transaction_id: item?.transaction_id ?? null,
          bukti_url: item?.bukti_url ?? null,
        };
      });

      return {
        _id: member._id,
        fullname: member.fullname,
        npa: member.npa,
        payments,
      };
    });

    return {
      meta: {
        year,
        region_id: regionId ?? null,
        generated_at: new Date(),
        total_members: members.length,
        last_updated: new Date(),
      },
      dues_periods: periods.map((p) => ({
        _id: p._id,
        month: p.month,
        year: p.year,
        amount: p.amount,
        is_active: p.is_active,
      })),
      members: membersWithPayments,
    };
  }
}
