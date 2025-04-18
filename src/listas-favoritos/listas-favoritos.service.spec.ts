import { Test, TestingModule } from '@nestjs/testing';
import { ListasFavoritosService } from './listas-favoritos.service';

describe('ListasFavoritosService', () => {
  let service: ListasFavoritosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListasFavoritosService],
    }).compile();

    service = module.get<ListasFavoritosService>(ListasFavoritosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
