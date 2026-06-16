import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateRegionsDto } from './dto/create-regions.dto';
import { UpdateRegionsDto } from './dto/update-regions.dto';
import { Regions, RegionsDocument } from './schemas/regions.schema';

@Injectable()
export class RegionsService {
  constructor(
    @InjectModel(Regions.name)
    private readonly regionsModel: Model<RegionsDocument>,
  ) {}

  async findAll(): Promise<RegionsDocument[]> {
    return this.regionsModel.find().populate('parent_id').exec();
  }

  async getDescendants(id: string): Promise<string[]> {
    const descendants: string[] = [id];
    const children = await this.regionsModel.find({ parent_id: id }).exec();

    for (const child of children) {
      const childDescendants = await this.getDescendants(child._id.toString());
      descendants.push(...childDescendants);
    }

    return descendants;
  }

  async getAncestors(id: string): Promise<string[]> {
    const ancestors: string[] = [id];
    let current = await this.regionsModel.findById(id).select('parent_id').exec();
    while (current?.parent_id) {
      const parentId = current.parent_id.toString();
      ancestors.push(parentId);
      current = await this.regionsModel.findById(parentId).select('parent_id').exec();
    }
    return ancestors;
  }

  async findOne(id: string): Promise<RegionsDocument> {
    const doc = await this.regionsModel.findById(id).populate('parent_id').exec();
    if (!doc) throw new NotFoundException('Regions not found');
    return doc;
  }

  async create(payload: CreateRegionsDto): Promise<RegionsDocument> {
    const created = new this.regionsModel(payload);
    return created.save();
  }

  async update(id: string, payload: UpdateRegionsDto): Promise<RegionsDocument> {
    const updated = await this.regionsModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Regions not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.regionsModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Regions not found');
    return { deleted: true };
  }
}
