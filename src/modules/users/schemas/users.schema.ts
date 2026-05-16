import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ANGGOTA = 'anggota',
  BENDAHARA_PJ = 'bendahara_pj',
  BENDAHARA_PC = 'bendahara_pc',
  BENDAHARA_PD = 'bendahara_pd',
}

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  npa!: string;

  @Prop({ required: true, trim: true })
  fullname!: string;

  @Prop({ unique: true, lowercase: true, trim: true, sparse: true })
  email?: string;

  @Prop({ unique: true, sparse: true, trim: true })
  no_hp?: string;

  @Prop({ required: true, select: false })
  password_hash!: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.ANGGOTA })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Regions' })
  region_id?: Types.ObjectId;

  @Prop({ default: false })
  is_active!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1, region_id: 1 });