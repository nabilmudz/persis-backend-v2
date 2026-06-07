import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BankAccountsDocument = BankAccounts & Document;

@Schema({ timestamps: true })
export class BankAccounts {
  @Prop({ type: Types.ObjectId, ref: 'PaymentMethod', required: true })
  payment_method_id!: Types.ObjectId;

  @Prop({ type: String, default: null })
  bank_name?: string;

  @Prop({ type: String, default: null })
  account_number?: string;

  @Prop({ type: String, default: null })
  qris_image_url?: string;

  @Prop({ default: true })
  is_active!: boolean;
}

export const BankAccountsSchema = SchemaFactory.createForClass(BankAccounts);

BankAccountsSchema.index({ region_id: 1, is_active: 1 });