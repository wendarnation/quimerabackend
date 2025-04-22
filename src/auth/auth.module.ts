import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { Auth0ManagementService } from './auth0-management.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    ConfigModule,
    PrismaModule,
    forwardRef(() => UsuariosModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, Auth0ManagementService, RolesGuard],
  exports: [AuthService, Auth0ManagementService, RolesGuard],
})
export class AuthModule {}
