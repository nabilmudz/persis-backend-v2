import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  UploadedFile, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { CreateTransactionItemDto } from './dto/create-transaction-item.dto';
import { UpdateTransactionItemDto } from './dto/update-transaction-item.dto';
import { TransactionItemService } from './transaction-item.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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

  @Get('user/:id')
  findByUserWithStatus(@Param('id') id: string) {
    return this.transactionItemService.findByUserWithStatus(id);
  }

  @Post()
  create(@Body() payload: CreateTransactionItemDto) {
    return this.transactionItemService.create(payload);
  }

  @Post('upload-bukti')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/bukti',
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `bukti-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
        if (!allowed.includes(extname(file.originalname).toLowerCase())) {
          return cb(new BadRequestException('Hanya file gambar atau PDF yang diizinkan'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadBukti(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File bukti diperlukan');
    return { bukti_url: `uploads/bukti/${file.filename}` };
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
