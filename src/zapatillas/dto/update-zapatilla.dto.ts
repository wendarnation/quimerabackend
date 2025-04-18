// src/zapatillas/dto/update-zapatilla.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateZapatillaDto } from './create-zapatilla.dto';

export class UpdateZapatillaDto extends PartialType(CreateZapatillaDto) {}
