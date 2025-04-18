import { Test, TestingModule } from '@nestjs/testing';
import { ListasFavoritosController } from './listas-favoritos.controller';

describe('ListasFavoritosController', () => {
  let controller: ListasFavoritosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListasFavoritosController],
    }).compile();

    controller = module.get<ListasFavoritosController>(ListasFavoritosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
