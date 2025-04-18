// src/zapatillas/dto/create-zapatilla.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateZapatillaDto {
  @IsNotEmpty()
  @IsString()
  marca: string;

  @IsNotEmpty()
  @IsString()
  modelo: string;

  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsOptional()
  @IsUrl()
  imagen?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
