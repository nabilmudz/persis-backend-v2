import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateDuesPeriodsDto } from './dto/create-dues-periods.dto';
import { UpdateDuesPeriodsDto } from './dto/update-dues-periods.dto';
import { DuesPeriodsService } from './dues-periods.service';

@Controller('dues-periods')
export class DuesPeriodsController {
  constructor(private readonly duesPeriodsService: DuesPeriodsService) {}

  @Get()
  findAll() {
    return this.duesPeriodsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.duesPeriodsService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateDuesPeriodsDto) {
    return this.duesPeriodsService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateDuesPeriodsDto) {
    return this.duesPeriodsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.duesPeriodsService.remove(id);
  }
}
