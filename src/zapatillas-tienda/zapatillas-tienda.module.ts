import { Module } from '@nestjs/common';
import { ZapatillasTiendaController } from './zapatillas-tienda.controller';
import { ZapatillasTiendaService } from './zapatillas-tienda.service';

@Module({
  controllers: [ZapatillasTiendaController],
  providers: [ZapatillasTiendaService]
})
export class ZapatillasTiendaModule {}
