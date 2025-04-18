import { Test, TestingModule } from '@nestjs/testing';
import { ZapatillasService } from './zapatillas.service';

describe('ZapatillasService', () => {
  let service: ZapatillasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZapatillasService],
    }).compile();

    service = module.get<ZapatillasService>(ZapatillasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
