import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMethod, PaymentMethodDocument } from '../../modules/payment-method/schemas/payment-method.schema';

@Injectable()
export class PaymentMethodSeeder {
  constructor(
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethodDocument>,
  ) {}

  async seed(): Promise<void> {
    const methods = [
      {
        code: 'Tunai',
        label: 'Pembayaran langsung di tempat',
      },
      {
        code: 'Transfer Bank',
        label: 'Pembayaran via Virtual Account atau transfer antar bank',
      },
      {
        code: 'QRIS',
        label: 'QRIS',
      },
    ];

    for (const method of methods) {
      await this.paymentMethodModel.updateOne(
        { code: method.code },
        { $setOnInsert: method },
        { upsert: true },
      );
    }
    console.log('Payment Methods seeded successfully');
  }
}