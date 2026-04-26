import { PartialType } from '@nestjs/mapped-types';
import { CreateRolesDto } from './create-roles.dto';

// PartialType makes all fields from CreateDto optional automatically
export class UpdateRolesDto extends PartialType(CreateRolesDto) {}
