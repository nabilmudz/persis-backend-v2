import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentMethodDocument = PaymentMethod & Document;

@Schema({ timestamps: true })
export class PaymentMethod {
  // TODO: define your fields here
  @Prop({ required: true })
  code!: string;

  @Prop({ required: false })
  label!: string;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
