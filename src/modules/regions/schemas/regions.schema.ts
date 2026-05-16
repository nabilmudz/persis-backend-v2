import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RegionsDocument = Regions & Document;

@Schema({ timestamps: true })
export class Regions {
  @Prop({ required: true, unique: true, trim: true })
  id!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, enum: ['PP', 'PW', 'PD', 'PC', 'PJ'] })
  level!: string;

  @Prop({ type: Types.ObjectId, ref: 'Regions', default: null })
  parent_id?: Types.ObjectId;
}

export const RegionsSchema = SchemaFactory.createForClass(Regions);

RegionsSchema.index({ parent_id: 1 });
RegionsSchema.index({ level: 1 });