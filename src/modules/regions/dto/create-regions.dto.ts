import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum RegionLevel {
  PJ = 'PJ',
  PC = 'PC',
  PD = 'PD',
}

export class CreateRegionsDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(RegionLevel)
  @IsNotEmpty()
  level!: RegionLevel;

  @IsMongoId()
  @IsOptional()
  parent_id?: string;
}