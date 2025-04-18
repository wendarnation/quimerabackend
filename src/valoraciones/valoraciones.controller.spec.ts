import { Test, TestingModule } from '@nestjs/testing';
import { ValoracionesController } from './valoraciones.controller';

describe('ValoracionesController', () => {
  let controller: ValoracionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValoracionesController],
    }).compile();

    controller = module.get<ValoracionesController>(ValoracionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
