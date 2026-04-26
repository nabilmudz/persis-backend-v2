import { PartialType } from '@nestjs/mapped-types';
import { CreateRegionsDto } from './create-regions.dto';

// PartialType makes all Create fields optional automatically
export class UpdateRegionsDto extends PartialType(CreateRegionsDto) {}
