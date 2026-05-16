import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../modules/users/schemas/users.schema';
import { Regions, RegionsDocument } from '../../modules/regions/schemas/regions.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const regionsModel = app.get<Model<RegionsDocument>>(getModelToken(Regions.name));

  console.log('Starting Region Reference Cleanup...');
  const users = await userModel.find({
    region_id: { $exists: true, $ne: null }
  }).exec();

  let fixedCount = 0;

  for (const user of users) {
    const rawRegionId = (user as any).region_id;
    if (rawRegionId && rawRegionId.__ref_region_name) {
      const regionCode = rawRegionId.__ref_region_name;
      const region = await regionsModel.findOne({ id: regionCode }).exec();

      if (region) {
        await userModel.updateOne(
          { _id: user._id },
          { $set: { region_id: region._id } }
        );
        fixedCount++;
        console.log(`Fixed User ${user.fullname}: Region ${regionCode} -> ${region.name}`);
      } else {
        console.warn(`[WARN] Region with ID '${regionCode}' not found for user ${user.fullname}`);
      }
    }
  }

  console.log(`\nDONE! Fixed ${fixedCount} user references.`);
  await app.close();
}

bootstrap();
