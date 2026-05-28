import { 
  IsNotEmpty, IsNumber, IsMongoId, IsArray, 
  ValidateNested, IsString, IsOptional, IsBoolean, IsDateString 
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTransactionItemDto } from '../../transaction-item/dto/create-transaction-item.dto';

export class CreateTransactionsDto {
  @IsString()
  @IsOptional()
  _id?: string; 

  @IsMongoId()
  @IsNotEmpty()
  creator_id!: string;

  @IsMongoId()
  @IsNotEmpty()
  payment_method_id!: string;

  @IsNumber()
  @IsNotEmpty()
  total_amount!: number;

  @IsString()
  @IsOptional()
  status: string = 'draft';

  @IsString()
  @IsOptional()
  acc_status: string = 'pending';

  @IsBoolean()
  @IsOptional()
  is_synced: boolean = false;

  @IsDateString()
  @IsOptional()
  created_at?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  @IsNotEmpty()
  items!: CreateTransactionItemDto[];

    @IsMongoId()
  @IsOptional()
  acc_by?: string;

  @IsDateString()
  @IsOptional()
  acc_at?: string;

  @IsDateString()
  @IsOptional()
  synced_at?: string;

}