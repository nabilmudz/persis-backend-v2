import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateTransactionItemDto } from './dto/create-transaction-item.dto';
import { UpdateTransactionItemDto } from './dto/update-transaction-item.dto';
import { TransactionItemService } from './transaction-item.service';

@Controller('transaction-item')
export class TransactionItemController {
  constructor(private readonly transactionItemService: TransactionItemService) {}

  @Get()
  findAll() {
    return this.transactionItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionItemService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateTransactionItemDto) {
    return this.transactionItemService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTransactionItemDto) {
    return this.transactionItemService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionItemService.remove(id);
  }
}
