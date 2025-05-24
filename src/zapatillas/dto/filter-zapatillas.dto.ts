import { IsOptional, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterZapatillasDto {
  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_max?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // Para búsqueda general en múltiples campos

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 15;

  @IsOptional()
  @IsString()
  sortBy?: string = 'fecha_creacion';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
