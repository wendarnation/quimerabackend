import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateComentarioDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  zapatilla_id: number;

  @IsNotEmpty()
  @IsString()
  texto: string;
}
