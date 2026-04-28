import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccounts, BankAccountsDocument } from './schemas/bank-account.schema';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectModel(BankAccounts.name)
    private readonly bankAccountModel: Model<BankAccountsDocument>,
  ) {}

  async findAll(): Promise<BankAccountsDocument[]> {
    return this.bankAccountModel.find().exec();
  }

  async findOne(id: string): Promise<BankAccountsDocument> {
    const doc = await this.bankAccountModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Bank Account not found');
    return doc;
  }

  async create(payload: CreateBankAccountDto): Promise<BankAccountsDocument> {
    const created = new this.bankAccountModel(payload);
    return created.save();
  }

  async update(id: string, payload: UpdateBankAccountDto): Promise<BankAccountsDocument> {
    const updated = await this.bankAccountModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Bank Account not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.bankAccountModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Bank Account not found');
    return { deleted: true };
  }
}
