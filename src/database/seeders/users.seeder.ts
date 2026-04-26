import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../../modules/users/schemas/users.schema';

@Injectable()
export class UsersSeeder {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async seed(): Promise<void> {
    const password_hash = await bcrypt.hash('password123', 10);

    const users = [
      {
        npa: 'PD-001',
        fullname: 'Admin Bendahara PD',
        email: 'bendahara.pd@persis.id',
        no_hp: '081234567890',
        password_hash,
        role: UserRole.BENDAHARA_PD,
        is_active: true,
      },
      {
        npa: 'PC-001',
        fullname: 'Admin Bendahara PC',
        email: 'bendahara.pc@persis.id',
        no_hp: '081234567891',
        password_hash,
        role: UserRole.BENDAHARA_PC,
        is_active: true,
      },
      {
        npa: 'PJ-001',
        fullname: 'Admin Bendahara PJ',
        email: 'bendahara.pj@persis.id',
        no_hp: '081234567892',
        password_hash,
        role: UserRole.BENDAHARA_PJ,
        is_active: true,
      },
      {
        npa: 'ANQ-001',
        fullname: 'Anggota Satu',
        email: 'anggota1@persis.id',
        no_hp: '081234567893',
        password_hash,
        role: UserRole.ANGGOTA,
        is_active: true,
      },
      {
        npa: 'ANQ-002',
        fullname: 'Anggota Dua',
        email: 'anggota2@persis.id',
        no_hp: '081234567894',
        password_hash,
        role: UserRole.ANGGOTA,
        is_active: false,
      },
    ];

    for (const user of users) {
      await this.userModel.updateOne(
        { npa: user.npa },
        { $setOnInsert: user },
        { upsert: true },
      );
    }

    console.log(`Users seeded: ${users.length} records`);
  }
}