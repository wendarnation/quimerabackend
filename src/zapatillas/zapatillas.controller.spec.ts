import { Test, TestingModule } from '@nestjs/testing';
import { ZapatillasController } from './zapatillas.controller';

describe('ZapatillasController', () => {
  let controller: ZapatillasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZapatillasController],
    }).compile();

    controller = module.get<ZapatillasController>(ZapatillasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
