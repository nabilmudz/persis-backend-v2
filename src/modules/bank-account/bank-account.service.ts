import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccounts, BankAccountsDocument } from './schemas/bank-account.schema';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectModel(BankAccounts.name)
    private readonly bankAccountModel: Model<BankAccountsDocument>,
  ) {}

  async findAll(
    regionId?: string,
    paymentMethodId?: string,
  ): Promise<BankAccountsDocument[]> {
    const filter: Record<string, any> = {};
    if (regionId) {
      filter.region_id = { $in: [regionId, new Types.ObjectId(regionId)] };
    }
    if (paymentMethodId) {
      filter.payment_method_id = { $in: [paymentMethodId, new Types.ObjectId(paymentMethodId)] };
    }
    return this.bankAccountModel
      .find(filter)
      .populate('payment_method_id')
      .populate('region_id', 'name level')
      .exec();
  }

  async findOne(id: string): Promise<BankAccountsDocument> {
    const doc = await this.bankAccountModel
      .findById(id)
      .populate('payment_method_id')
      .populate('region_id', 'name level')
      .exec();
    if (!doc) throw new NotFoundException('Bank Account not found');
    return doc;
  }

  async create(
    payload: CreateBankAccountDto,
    file?: Express.Multer.File,
  ): Promise<BankAccountsDocument> {
    if (file) {
      payload.qris_image_url = `uploads/qris/${file.filename}`;
    }

    const created = new this.bankAccountModel({
      ...payload,
      region_id: payload.region_id ? new Types.ObjectId(payload.region_id) : undefined,
      payment_method_id: new Types.ObjectId(payload.payment_method_id),
    });
    return created.save();
  }

  async update(
    id: string,
    payload: UpdateBankAccountDto,
  ): Promise<BankAccountsDocument> {
    const updateData: Record<string, any> = { ...payload };
    if (payload.region_id) updateData.region_id = new Types.ObjectId(payload.region_id);
    if (payload.payment_method_id) updateData.payment_method_id = new Types.ObjectId(payload.payment_method_id);

    const updated = await this.bankAccountModel
      .findByIdAndUpdate(id, updateData, { new: true })
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
