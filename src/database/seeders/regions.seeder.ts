import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Regions, RegionsDocument } from '../../modules/regions/schemas/regions.schema';

@Injectable()
export class RegionsSeeder {
  constructor(
    @InjectModel(Regions.name)
    private readonly regionsModel: Model<RegionsDocument>,
  ) { }

  async seed(): Promise<void> {
    const data = [
      { id: '1', level: 'PP', name: 'Pimpinan Pusat', parentId: '0' },
      { id: '2', level: 'PW', name: 'Jawa Barat', parentId: '1' },
      { id: '3', level: 'PD', name: 'Kabupaten Bandung', parentId: '2' },
      { id: '4', level: 'PC', name: 'Banjaran', parentId: '3' },
      { id: '5', level: 'PC', name: 'Katapang', parentId: '3' },
      { id: '6', level: 'PJ', name: 'Banjaran', parentId: '4' },
      { id: '7', level: 'PJ', name: 'Ciapus', parentId: '4' },
      { id: '8', level: 'PJ', name: 'Cihamerang', parentId: '4' },
      { id: '9', level: 'PJ', name: 'Cileutik', parentId: '4' },
      { id: '10', level: 'PJ', name: 'Cintaasih', parentId: '4' },
      { id: '11', level: 'PJ', name: 'Cipeundeuy', parentId: '4' },
      { id: '12', level: 'PJ', name: 'Kiarapayung', parentId: '4' },
      { id: '13', level: 'PJ', name: 'Lebakwangi', parentId: '4' },
      { id: '14', level: 'PJ', name: 'Pamoyanan', parentId: '4' },
      { id: '15', level: 'PJ', name: 'Pangkalan', parentId: '4' },
      { id: '16', level: 'PJ', name: 'Sasak Dua', parentId: '4' },
      { id: '17', level: 'PJ', name: 'Sirnagalih', parentId: '4' },
      { id: '18', level: 'PJ', name: 'Cipaku', parentId: '4' },
      { id: '19', level: 'PJ', name: 'Empel', parentId: '4' },
    ];

    const idToObjectId: Record<string, any> = {};

    for (const item of data) {
      const parentObjectId = item.parentId !== '0' ? idToObjectId[item.parentId] : null;

      const region = await this.regionsModel.findOneAndUpdate(
        { id: item.id },
        {
          $set: {
            name: item.name,
            level: item.level,
            parent_id: parentObjectId,
          },
        },
        { upsert: true, new: true },
      );

      idToObjectId[item.id] = region._id;
    }

    console.log('Regions seeded successfully');
  }
}