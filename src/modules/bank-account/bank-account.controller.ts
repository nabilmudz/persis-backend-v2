import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccountService } from './bank-account.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('bank-account')
@UseGuards(JwtAuthGuard)
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Get()
  findAll(
    @Query('region_id') regionId?: string,
    @Query('payment_method_id') paymentMethodId?: string,
  ) {
    return this.bankAccountService.findAll(regionId, paymentMethodId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankAccountService.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('qris_image_url', {
      storage: diskStorage({
        destination: './uploads/qris',
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `qris-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!allowed.includes(extname(file.originalname).toLowerCase())) {
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
  update(
    @Param('id') id: string,
    @Body() payload: UpdateBankAccountDto,
  ) {
    return this.bankAccountService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bankAccountService.remove(id);
  }
}
