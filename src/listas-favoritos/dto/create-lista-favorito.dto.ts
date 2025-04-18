import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateListaFavoritoDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsBoolean()
  predeterminada?: boolean;
}
