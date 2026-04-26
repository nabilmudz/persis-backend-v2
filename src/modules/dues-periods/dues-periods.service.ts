import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateDuesPeriodsDto } from './dto/create-dues-periods.dto';
import { UpdateDuesPeriodsDto } from './dto/update-dues-periods.dto';
import { DuesPeriods, DuesPeriodsDocument } from './schemas/dues-periods.schema';

@Injectable()
export class DuesPeriodsService {
  constructor(
    @InjectModel(DuesPeriods.name)
    private readonly duesPeriodsModel: Model<DuesPeriodsDocument>,
  ) {}

  async findAll(): Promise<DuesPeriodsDocument[]> {
    return this.duesPeriodsModel.find().exec();
  }

  async findOne(id: string): Promise<DuesPeriodsDocument> {
    const doc = await this.duesPeriodsModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Dues Periods not found');
    return doc;
  }

  async create(payload: CreateDuesPeriodsDto): Promise<DuesPeriodsDocument> {
    const created = new this.duesPeriodsModel(payload);
    return created.save();
  }

  async update(id: string, payload: UpdateDuesPeriodsDto): Promise<DuesPeriodsDocument> {
    const updated = await this.duesPeriodsModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Dues Periods not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.duesPeriodsModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Dues Periods not found');
    return { deleted: true };
  }
}
