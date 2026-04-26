import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DuesPeriodsDocument = DuesPeriods & Document;

@Schema({ timestamps: true })
export class DuesPeriods {
  @Prop({ required: true })
  year!: number;

  @Prop({ required: true, min: 1, max: 12 })
  month!: number;

  @Prop({ default: 20000 })
  amount!: number;

  @Prop({ default: true })
  is_active!: boolean;
}

export const DuesPeriodsSchema = SchemaFactory.createForClass(DuesPeriods);

DuesPeriodsSchema.index({ year: 1, month: 1 }, { unique: true });