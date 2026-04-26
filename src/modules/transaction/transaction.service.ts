import { CreateTransactionsDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transactions, TransactionsDocument } from './schemas/transaction.schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { TransactionItems, TransactionItemsDocument } from '../transaction-item/schemas/transaction-item.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transactions.name) private transactionModel: Model<TransactionsDocument>,
    @InjectModel(TransactionItems.name) private transactionItemsModel: Model<TransactionItemsDocument>, 
    @InjectConnection() private connection: Connection,
  ) {}

  async findAll(): Promise<TransactionsDocument[]> {
    return this.transactionModel.find().exec();
  }

  async findOne(id: string): Promise<TransactionsDocument> {
    const doc = await this.transactionModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Transaction not found');
    return doc;
  }
  async create(payload: CreateTransactionsDto): Promise<any> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const { items, ...transactionData } = payload;

      const [newTransaction] = await this.transactionModel.create([transactionData], { session });
      const itemsWithHeaderId = items.map(item => ({
        ...item,
        transaction_id: newTransaction._id,
      }));

      const createdItems = await this.transactionItemsModel.create(itemsWithHeaderId, { 
        session, 
        ordered: true 
      });

      await session.commitTransaction();
      const result = newTransaction.toObject();
      return {
        ...result,
        items: createdItems
      };
      
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
