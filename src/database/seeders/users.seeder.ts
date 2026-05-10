import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../../modules/users/schemas/users.schema';
import { Regions, RegionsDocument } from '../../modules/regions/schemas/regions.schema';

@Injectable()
export class UsersSeeder {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Regions.name)
    private readonly regionsModel: Model<RegionsDocument>,
  ) {}

  async seed(): Promise<void> {
    const password_hash = await bcrypt.hash('password123', 10);
    const pd = await this.regionsModel.findOne({ level: 'PD' });
    const pc = await this.regionsModel.findOne({ level: 'PC' });
    const pj = await this.regionsModel.findOne({ level: 'PJ' });

    if (!pd || !pc || !pj) {
      throw new Error('Regions not found. Run regions seeder first.');
    }

    const users = [
      {
        npa: '001',
        fullname: 'Admin Bendahara PD',
        email: 'bendahara.pd@persis.id',
        no_hp: '081234567890',
        password_hash,
        role: UserRole.BENDAHARA_PD,
        region_id: pd._id,
        is_active: true,
      },
      {
        npa: '002',
        fullname: 'Admin Bendahara PC',
        email: 'bendahara.pc@persis.id',
        no_hp: '081234567891',
        password_hash,
        role: UserRole.BENDAHARA_PC,
        region_id: pc._id,
        is_active: true,
      },
      {
        npa: '003',
        fullname: 'Admin Bendahara PJ',
        email: 'bendahara.pj@persis.id',
        no_hp: '081234567892',
        password_hash,
        role: UserRole.BENDAHARA_PJ,
        region_id: pj._id,
        is_active: true,
      },
      {
        npa: '004',
        fullname: 'Anggota Satu',
        email: 'anggota1@persis.id',
        no_hp: '081234567893',
        password_hash,
        role: UserRole.ANGGOTA,
        region_id: pj._id,
        is_active: true,
      },
      {
        npa: '005',
        fullname: 'Anggota Dua',
        email: 'anggota2@persis.id',
        no_hp: '081234567894',
        password_hash,
        role: UserRole.ANGGOTA,
        region_id: pj._id,
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