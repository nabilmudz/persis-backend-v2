import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Regions, RegionsDocument } from '../../modules/regions/schemas/regions.schema';

@Injectable()
export class RegionsSeeder {
  constructor(
    @InjectModel(Regions.name)
    private readonly regionsModel: Model<RegionsDocument>,
  ) {}

  async seed(): Promise<void> {
    const pd = await this.regionsModel.findOneAndUpdate(
      { name: 'PD Kab. Bandung', level: 'PD' },
      { $setOnInsert: { name: 'PD Kab. Bandung', level: 'PD' } },
      { upsert: true, new: true }
    );

    const pcs = [
      { name: 'PC Baleendah', level: 'PC', parent_id: pd._id },
      { name: 'PC Ciparay', level: 'PC', parent_id: pd._id },
    ];

    for (const pcData of pcs) {
      const pc = await this.regionsModel.findOneAndUpdate(
        { name: pcData.name, level: 'PC' },
        { $setOnInsert: pcData },
        { upsert: true, new: true }
      );

      const pjs = [
        { name: `PJ Jamaah A - ${pc.name}`, level: 'PJ', parent_id: pc._id },
        { name: `PJ Jamaah B - ${pc.name}`, level: 'PJ', parent_id: pc._id },
      ];

      for (const pj of pjs) {
        await this.regionsModel.updateOne(
          { name: pj.name, level: 'PJ' },
          { $setOnInsert: pj },
          { upsert: true }
        );
      }
    }
    console.log('Regions seeded successfully (PD -> PC -> PJ)');
  }
}