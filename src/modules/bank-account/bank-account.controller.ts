import {
  Body, Controller, Post, Get, Param, Patch, Delete, UploadedFile,
  UseInterceptors, BadRequestException,
} from '@nestjs/common';

import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccountService } from './bank-account.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('bank-account')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Get()
  findAll() {
    return this.bankAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankAccountService.findOne(id);
  }
  
  @Post()
  @UseInterceptors(
    FileInterceptor('qris_image', {
      storage: diskStorage({
        destination: './uploads/qris',
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `qris-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Hanya file gambar yang diizinkan'), false);
        }
        cb(null, true);
      },
    }),
  )
  
  create(
    @Body() payload: CreateBankAccountDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bankAccountService.create(payload, file);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateBankAccountDto) {
    return this.bankAccountService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bankAccountService.remove(id);
  }
}
