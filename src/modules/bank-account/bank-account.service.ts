import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccounts, BankAccountsDocument } from './schemas/bank-account.schema';
import { JwtUser } from '../../common/strategies/jwt.strategy';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectModel(BankAccounts.name)
    private readonly bankAccountModel: Model<BankAccountsDocument>,
  ) {}

  async findAll(user: JwtUser): Promise<BankAccountsDocument[]> {
    return this.bankAccountModel
      .find({ region_id: new Types.ObjectId(user.region_id) })
      .populate('payment_method_id')
      .populate('region_id', 'name level')
      .exec();
  }

  async findOne(id: string, user: JwtUser): Promise<BankAccountsDocument> {
    const doc = await this.bankAccountModel
      .findOne({ _id: id, region_id: new Types.ObjectId(user.region_id) })
      .populate('payment_method_id')
      .populate('region_id', 'name level')
      .exec();
    if (!doc) throw new NotFoundException('Bank Account not found');
    return doc;
  }

  async create(
    payload: CreateBankAccountDto,
    user: JwtUser,
    file?: Express.Multer.File,
  ): Promise<BankAccountsDocument> {
    if (file) {
      payload.qris_image_url = `uploads/qris/${file.filename}`;
    }

    const created = new this.bankAccountModel({
      ...payload,
      region_id: new Types.ObjectId(user.region_id),
    });
    return created.save();
  }

  async update(
    id: string,
    payload: UpdateBankAccountDto,
    user: JwtUser,
  ): Promise<BankAccountsDocument> {
    const updated = await this.bankAccountModel
      .findOneAndUpdate(
        { _id: id, region_id: new Types.ObjectId(user.region_id) },
        payload,
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Bank Account not found');
    return updated;
  }

  async remove(id: string, user: JwtUser): Promise<{ deleted: true }> {
    const result = await this.bankAccountModel
      .findOneAndDelete({ _id: id, region_id: new Types.ObjectId(user.region_id) })
      .exec();
    if (!result) throw new NotFoundException('Bank Account not found');
    return { deleted: true };
  }
}
