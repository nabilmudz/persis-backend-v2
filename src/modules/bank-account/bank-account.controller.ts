import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';

@Controller('bank-account')
@UseGuards(JwtAuthGuard)
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.bankAccountService.findAll(user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.bankAccountService.findOne(id, user);
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
    @CurrentUser() user: JwtUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bankAccountService.create(payload, user, file);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateBankAccountDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.bankAccountService.update(id, payload, user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.bankAccountService.remove(id, user);
  }
}
