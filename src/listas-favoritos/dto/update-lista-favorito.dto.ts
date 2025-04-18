import { PartialType } from '@nestjs/mapped-types';
import { CreateListaFavoritoDto } from './create-lista-favorito.dto';

export class UpdateListaFavoritoDto extends PartialType(
  CreateListaFavoritoDto,
) {}
