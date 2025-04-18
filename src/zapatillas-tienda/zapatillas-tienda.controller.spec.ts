import { Test, TestingModule } from '@nestjs/testing';
import { ZapatillasTiendaController } from './zapatillas-tienda.controller';

describe('ZapatillasTiendaController', () => {
  let controller: ZapatillasTiendaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZapatillasTiendaController],
    }).compile();

    controller = module.get<ZapatillasTiendaController>(ZapatillasTiendaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
