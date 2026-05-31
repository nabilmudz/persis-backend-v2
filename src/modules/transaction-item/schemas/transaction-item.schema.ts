import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionItemsDocument = TransactionItems & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class TransactionItems {
  @Prop({ type: Types.ObjectId, ref: 'Transactions', required: true })
  transaction_id!: Types.ObjectId;
  
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  anggota_id!: Types.ObjectId;
  
  @Prop({ type: Types.ObjectId, ref: 'DuesPeriods', required: true })
  period_id!: Types.ObjectId;
  
  @Prop({ enum: ['pending', 'paid'], default: 'pending' })
  status!: string;

  @Prop({ type: String, required: false })
  bukti_url?: string;
}

export const TransactionItemsSchema = SchemaFactory.createForClass(TransactionItems);

TransactionItemsSchema.index({ anggota_id: 1, period_id: 1 }, { unique: true });