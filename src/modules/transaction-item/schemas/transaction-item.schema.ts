import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TransactionItemsDocument = TransactionItems & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class TransactionItems {
  @Prop({ type: String, default: uuidv4 })
  _id!: string;

  @Prop({ type: String, ref: 'Transactions', required: true })
  transaction_id!: string;
  
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