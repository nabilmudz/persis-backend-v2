import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateTransactionItemDto } from './dto/create-transaction-item.dto';
import { UpdateTransactionItemDto } from './dto/update-transaction-item.dto';
import { TransactionItems, TransactionItemsDocument } from './schemas/transaction-item.schema';

@Injectable()
export class TransactionItemService {
  constructor(
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: Model<TransactionItemsDocument>,
  ) {}

  async findAll(): Promise<TransactionItemsDocument[]> {
    return this.transactionItemModel.find().exec();
  }

  async findOne(id: string): Promise<TransactionItemsDocument> {
    const doc = await this.transactionItemModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Transaction Item not found');
    return doc;
  }

  async create(payload: CreateTransactionItemDto): Promise<TransactionItemsDocument> {
    const created = new this.transactionItemModel(payload);
    return created.save();
  }

  async update(id: string, payload: UpdateTransactionItemDto): Promise<TransactionItemsDocument> {
    const updated = await this.transactionItemModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Transaction Item not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.transactionItemModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Transaction Item not found');
    return { deleted: true };
  }
}
