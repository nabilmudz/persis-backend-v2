import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { Inject } from '@nestjs/common';
import * as config from '@nestjs/config';
import jwtConfig from '../../config/jwt.config';
import * as crypto from 'node:crypto';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { User, UserDocument } from './schemas/users.schema';
import { EmailService } from '../../helper/mail/email.service';
import { OtpService } from '../otp/otp.service';
import { TransactionItems, TransactionItemsDocument } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsDocument } from '../dues-periods/schemas/dues-periods.schema';
import { RegionsService } from '../regions/regions.service';

export interface LoginResponse {
  user: {
    _id: any;
    email: string;
    role: string;
    fullname: string;
  };
  access_token: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: Model<TransactionItemsDocument>,
    @InjectModel(DuesPeriods.name)
    private readonly periodModel: Model<DuesPeriodsDocument>,
    @Inject(jwtConfig.KEY) private readonly jwtCfg: config.ConfigType<typeof jwtConfig>,
    private otpService: OtpService,
    private emailService: EmailService,
    private regionsService: RegionsService,
  ) { }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().populate('region_id').select('-password_hash').exec();
  }

  async findAllWithStatus(): Promise<any[]> {
    const [users, periods, items] = await Promise.all([
      this.userModel.find().populate('region_id').select('-password_hash').exec(),
      this.periodModel.find({ is_active: true }).exec(),
      this.transactionItemModel.find().exec(),
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const pastPeriods = periods.filter(period =>
      period.year < currentYear || (period.year === currentYear && period.month < currentMonth)
    );

    return users.map(user => {
      const userItems = items.filter(item => item.anggota_id.toString() === user._id.toString());

      const hasTunggakan = pastPeriods.some(period => {
        const item = userItems.find(i => i.period_id.toString() === period._id.toString());
        return !item;
      });

      return {
        ...user.toObject(),
        status_tag: hasTunggakan ? 'tunggakan' : 'lunas',
      };
    });
  }

  async findOne(id: string): Promise<UserDocument> {
    this.validateObjectId(id);
    const user = await this.userModel.findById(id).select('-password_hash').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByNpa(npa: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ npa }).exec();
  }

  async findByRegion(regionId: string): Promise<UserDocument[]> {
    const descendantIds = await this.regionsService.getDescendants(regionId);
    return this.userModel
      .find({ region_id: { $in: descendantIds.map(id => new Types.ObjectId(id)) } })
      .populate('region_id')
      .select('-password_hash')
      .exec();
  }

  async login(payload: { email: string; password: string }) {
    const input = payload.email;
    const isNpa = !input.includes('@');

    const user = await this.userModel
      .findOne(isNpa ? { npa: input } : { email: input })
      .select('+password_hash')
      .exec();

    if (!user) {
      throw new NotFoundException(
        isNpa ? 'NPA tidak ditemukan' : 'Email tidak ditemukan'
      );
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password_hash);
    if (!isPasswordValid) throw new BadRequestException('Password salah');

    const { password_hash, ...userWithoutPassword } = user.toObject();
    const jwtPayload = { sub: user._id, email: user.email, role: user.role };
    const access_token = jwt.sign(jwtPayload, this.jwtCfg.secret!, { expiresIn: '1d' });

    return { user: userWithoutPassword, access_token };
  }

  async create(payload: CreateUsersDto): Promise<UserDocument> {
    const [existingNpa, existingEmail] = await Promise.all([
      this.userModel.findOne({ npa: payload.npa }),
      this.userModel.findOne({ email: payload.email }),
    ]);

    if (existingNpa) throw new ConflictException('NPA sudah terdaftar');
    if (existingEmail) throw new ConflictException('Email sudah terdaftar');

    const password_hash = await bcrypt.hash(payload.password, 10);

    const created = new this.userModel({
      ...payload,
      password_hash,
      region_id: payload.region_id ? new Types.ObjectId(payload.region_id) : undefined,
    });

    await created.save();

    return this.userModel.findById(created._id).select('-password_hash').exec() as Promise<UserDocument>;
  }

  async update(id: string, payload: UpdateUsersDto): Promise<UserDocument> {
    this.validateObjectId(id);

    const updated = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          ...payload,
          region_id: payload.region_id ? new Types.ObjectId(payload.region_id) : undefined,
        },
        { new: true },
      )
      .select('-password_hash')
      .exec();

    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async checkNpa(npa: string) {
    const user = await this.userModel.findOne({ npa }).exec();
    if (!user) {
      throw new NotFoundException('NPA tidak ditemukan');
    }

    if (user.is_active || user.password_hash) {
      throw new BadRequestException('NPA sudah aktif, silakan login');
    }

    return {
      message: 'NPA valid',
      id: user._id,
      npa: user.npa,
      fullname: user.fullname,
    };
  }

  async setPassword(npaOrEmail: string, password: string) {
    if (!npaOrEmail) {
      throw new BadRequestException('Identifier (NPA or Email) is required');
    }
    const isNpa = !npaOrEmail.includes('@');
    const user = await this.userModel.findOne(
      isNpa ? { npa: npaOrEmail } : { email: npaOrEmail }
    ).exec();

    if (!user) {
      throw new NotFoundException(isNpa ? 'NPA tidak ditemukan' : 'Email tidak ditemukan');
    }

    const hashed = await bcrypt.hash(password, 10);

    await this.userModel.updateOne(
      { _id: user._id },
      { password_hash: hashed, is_active: true },
    ).exec();

    return { message: 'Password berhasil disimpan' };
  }

  async activate(payload: any): Promise<any> {
    const { npa, email } = payload;
    const identifier = npa || email;

    const isNpa = identifier && !identifier.includes('@');
    const user = await this.userModel.findOne(
      isNpa ? { npa: identifier } : { email: identifier }
    ).exec();

    if (!user) throw new NotFoundException('User tidak ditemukan');

    const otp = await this.otpService.generate(user.npa);
    await this.emailService.sendOtp(user.email, otp);

    return { message: 'OTP berhasil dikirim ke email' };
  }

  async verifyOtp(npaOrEmail: string, otp: string): Promise<any> {
    const isNpa = !npaOrEmail.includes('@');
    const user = await this.userModel.findOne(
      isNpa ? { npa: npaOrEmail } : { email: npaOrEmail }
    ).exec();

    if (!user) throw new BadRequestException('User tidak ditemukan');

    await this.otpService.verify(user.npa, otp);

    await this.userModel.updateOne(
      { _id: user._id },
      { is_active: true },
    );

    return { message: 'Akun berhasil diaktivasi' };
  }

  async remove(id: string): Promise<{ deleted: true }> {
    this.validateObjectId(id);
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('User not found');
    return { deleted: true };
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID tidak valid');
    }
  }

}