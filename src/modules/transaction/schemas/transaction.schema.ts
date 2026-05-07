import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TransactionsDocument = Transactions & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Transactions {
  @Prop({ type: String, default: uuidv4 })
  _id!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PaymentMethod', required: true })
  payment_method_id!: Types.ObjectId;

  @Prop({ enum: ['draft', 'completed', 'cancelled'], default: 'draft' })
  status!: string;

  @Prop({ required: true })
  total_amount!: number;

  @Prop({ enum: ['pending', 'acc_pj', 'acc_pc', 'acc_pd'], default: 'pending' })
  acc_status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  acc_by?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  acc_at?: Date;

  @Prop({ default: false })
  is_synced!: boolean;

  @Prop({ type: Date, default: null })
  synced_at?: Date;
}

export const TransactionsSchema = SchemaFactory.createForClass(Transactions);
TransactionsSchema.virtual('transaction_items', {
  ref: 'TransactionItems',
  localField: '_id',
  foreignField: 'transaction_id',
});
TransactionsSchema.set('toJSON', { virtuals: true });
TransactionsSchema.set('toObject', { virtuals: true });