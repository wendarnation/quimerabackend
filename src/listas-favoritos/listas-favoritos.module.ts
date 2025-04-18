import { Module } from '@nestjs/common';
import { ListasFavoritosController } from './listas-favoritos.controller';
import { ListasFavoritosService } from './listas-favoritos.service';

@Module({
  controllers: [ListasFavoritosController],
  providers: [ListasFavoritosService]
})
export class ListasFavoritosModule {}
