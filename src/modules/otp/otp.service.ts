import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './schemas/otp.schema';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  constructor(@InjectModel(Otp.name) private otpModel: Model<Otp>) {}

  async generate(npa: string): Promise<string> {
    await this.otpModel.deleteMany({ npa });

    const otp = crypto.randomInt(1000, 9999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpModel.create({ npa, hashedOtp, expiresAt, used: false });

    return otp;
  }

  async verify(npa: string, otp: string): Promise<boolean> {
    const record = await this.otpModel.findOne({
      npa,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) throw new BadRequestException('OTP tidak valid atau sudah expired');
    
    const isMatch = await bcrypt.compare(otp, record.hashedOtp as string);
    if (!isMatch) throw new BadRequestException('OTP salah');
    await this.otpModel.updateOne({ _id: record._id }, { used: true });

    return true;
  }
}