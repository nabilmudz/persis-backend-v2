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

import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { User, UserDocument } from './schemas/users.schema';

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
    @Inject(jwtConfig.KEY) private readonly jwtCfg: config.ConfigType<typeof jwtConfig>,
  ) {}

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password_hash').exec();
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
    return this.userModel
      .find({ region_id: new Types.ObjectId(regionId) })
      .select('-password_hash')
      .exec();
  }

  async login(payload: { email: string; password: string }): Promise<{ user: any; access_token: string }> {
    const user = await this.userModel
      .findOne({ email: payload.email.toLowerCase() })
      .select('+password_hash')
      .exec();
    
    if (!user) throw new NotFoundException('User tidak ditemukan');
    
    const isPasswordValid = await bcrypt.compare(payload.password, user.password_hash);
    if (!isPasswordValid) throw new BadRequestException('Password salah');
    const userObject = user.toObject();
    const { password_hash, ...userWithoutPassword } = userObject;
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

  async activate(id: string): Promise<UserDocument> {
    this.validateObjectId(id);
    console.log("ID",id)
    const user = await this.userModel
      .findByIdAndUpdate(id, { is_active: true }, { new: true })
      .select('-password_hash')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
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