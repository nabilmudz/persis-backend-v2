import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Otp {
    @Prop({ required: true }) npa!: string;
    @Prop({ required: true }) hashedOtp?: string;
    @Prop({ required: true }) expiresAt?: Date;
    @Prop({ default: false }) used?: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });