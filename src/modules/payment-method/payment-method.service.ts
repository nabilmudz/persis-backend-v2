import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethod, PaymentMethodDocument } from './schemas/payment-method.schema';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethodDocument>,
  ) {}

  async findAll(): Promise<PaymentMethodDocument[]> {
    return this.paymentMethodModel.find().exec();
  }

  async findOne(id: string): Promise<PaymentMethodDocument> {
    const doc = await this.paymentMethodModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Payment Method not found');
    return doc;
  }

  async create(payload: CreatePaymentMethodDto): Promise<PaymentMethodDocument> {
    const created = new this.paymentMethodModel(payload);
    return created.save();
  }

  async update(id: string, payload: UpdatePaymentMethodDto): Promise<PaymentMethodDocument> {
    const updated = await this.paymentMethodModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Payment Method not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.paymentMethodModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Payment Method not found');
    return { deleted: true };
  }
}
