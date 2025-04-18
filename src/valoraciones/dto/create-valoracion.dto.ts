import { IsNotEmpty, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateValoracionDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  zapatilla_id: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  puntuacion: number;
}
