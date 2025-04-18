import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateTiendaDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean = true;
}
