import { Test, TestingModule } from '@nestjs/testing';
import { ZapatillasTiendaService } from './zapatillas-tienda.service';

describe('ZapatillasTiendaService', () => {
  let service: ZapatillasTiendaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZapatillasTiendaService],
    }).compile();

    service = module.get<ZapatillasTiendaService>(ZapatillasTiendaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
