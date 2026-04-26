import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DuesPeriods, DuesPeriodsDocument } from '../../modules/dues-periods/schemas/dues-periods.schema';

@Injectable()
export class DuesPeriodsSeeder {
  constructor(
    @InjectModel(DuesPeriods.name)
    private readonly duesModel: Model<DuesPeriodsDocument>,
  ) {}

  async seed(): Promise<void> {
    const year = 2026;
    for (let month = 1; month <= 12; month++) {
      await this.duesModel.updateOne(
        { year, month },
        { 
          $setOnInsert: { 
            year, 
            month, 
            amount: 20000, 
            is_active: true 
          } 
        },
        { upsert: true }
      );
    }
    console.log('Dues Periods seeded successfully for year 2026');
  }
}