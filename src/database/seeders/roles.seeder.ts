import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roles, RolesDocument } from '../../modules/roles/schemas/roles.schema';

@Injectable()
export class RolesSeeder {
  constructor(
    @InjectModel(Roles.name)
    private readonly roleModel: Model<RolesDocument>,
  ) {}

  async seed(): Promise<void> {
    const roles = [
      {
        code: 'ANG',
        name: 'Anggota',
        description: 'Member biasa Pemuda Persis',
      },
      {
        code: 'PJ',
        name: 'Bendahara PJ',
        description: 'Bendahara tingkat Jamaah, verifikasi pembayaran tunai',
      },
      {
        code: 'PC',
        name: 'Bendahara PC',
        description: 'Bendahara tingkat Cabang, verifikasi pembayaran transfer',
      },
      {
        code: 'PD',
        name: 'Bendahara PD',
        description: 'Bendahara tingkat Daerah, ACC final laporan keuangan',
      },
    ];

    for (const role of roles) {
      await this.roleModel.updateOne(
        { code: role.code },
        { $setOnInsert: role },
        { upsert: true },
      );
    }

    console.log('Roles seeded successfully');
  }
}