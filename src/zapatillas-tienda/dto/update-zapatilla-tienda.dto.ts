import { PartialType } from '@nestjs/mapped-types';
import { CreateZapatillaTiendaDto } from './create-zapatilla-tienda.dto';

export class UpdateZapatillaTiendaDto extends PartialType(
  CreateZapatillaTiendaDto,
) {}
