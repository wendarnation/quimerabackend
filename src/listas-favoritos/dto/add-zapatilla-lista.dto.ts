import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AddZapatillaListaDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  zapatilla_id: number;
}
