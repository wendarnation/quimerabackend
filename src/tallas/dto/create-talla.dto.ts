import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTallaDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  zapatilla_tienda_id: number;

  @IsNotEmpty()
  @IsString()
  talla: string;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean = true;
}
