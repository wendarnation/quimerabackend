// src/zapatillas/dto/create-zapatilla.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsBoolean } from 'class-validator';

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

  // Campo opcional para permitir establecer el estado activo
  // aunque internamente siempre se establecerá como true
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
