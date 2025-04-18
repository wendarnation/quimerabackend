import { Module } from '@nestjs/common';
import { ValoracionesController } from './valoraciones.controller';
import { ValoracionesService } from './valoraciones.service';

@Module({
  controllers: [ValoracionesController],
  providers: [ValoracionesService]
})
export class ValoracionesModule {}
