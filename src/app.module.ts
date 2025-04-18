import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ZapatillasModule } from './zapatillas/zapatillas.module';
import { TiendasModule } from './tiendas/tiendas.module';
import { ZapatillasTiendaModule } from './zapatillas-tienda/zapatillas-tienda.module';
import { TallasModule } from './tallas/tallas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ListasFavoritosModule } from './listas-favoritos/listas-favoritos.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { ValoracionesModule } from './valoraciones/valoraciones.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    ZapatillasModule,
    TiendasModule,
    ZapatillasTiendaModule,
    TallasModule,
    UsuariosModule,
    ListasFavoritosModule,
    ComentariosModule,
    ValoracionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
