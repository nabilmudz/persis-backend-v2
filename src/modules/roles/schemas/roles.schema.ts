import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RolesDocument = Roles & Document;

@Schema({ timestamps: true })
export class Roles {
  @Prop({ required: true, unique: true })
  code!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;
}

export const RolesSchema = SchemaFactory.createForClass(Roles);
