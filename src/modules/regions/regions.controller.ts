import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateRegionsDto } from './dto/create-regions.dto';
import { UpdateRegionsDto } from './dto/update-regions.dto';
import { RegionsService } from './regions.service';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  findAll() {
    return this.regionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateRegionsDto) {
    return this.regionsService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateRegionsDto) {
    return this.regionsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.regionsService.remove(id);
  }
}
