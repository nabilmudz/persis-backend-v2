import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateRolesDto } from './dto/create-roles.dto';
import { UpdateRolesDto } from './dto/update-roles.dto';
import { Roles, RolesDocument } from './schemas/roles.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<RolesDocument>,
  ) {}

  async findAll(): Promise<RolesDocument[]> {
    return this.rolesModel.find().exec();
  }

  async findOne(id: string): Promise<RolesDocument> {
    const doc = await this.rolesModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Roles not found');
    return doc;
  }

  async create(payload: CreateRolesDto): Promise<RolesDocument> {
    const created = new this.rolesModel(payload);
    return created.save();
  }

  async update(id: string, payload: UpdateRolesDto): Promise<RolesDocument> {
    const updated = await this.rolesModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Roles not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.rolesModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Roles not found');
    return { deleted: true };
  }
}
