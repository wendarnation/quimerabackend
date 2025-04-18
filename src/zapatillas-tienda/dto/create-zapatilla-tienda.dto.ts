import {
  IsNotEmpty,
  IsNumber,
  IsDecimal,
  IsBoolean,
  IsUrl,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZapatillaTiendaDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  zapatilla_id: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  tienda_id: number;

  @IsOptional()
  @IsString()
  modelo_tienda?: string;

  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '2' })
  precio: number;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean = true;

  @IsNotEmpty()
  @IsUrl()
  url_producto: string;
}
