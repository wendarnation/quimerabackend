// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero se intenta activar el guardia de passport-jwt
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }
}
