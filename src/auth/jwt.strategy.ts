import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      audience: configService.get('AUTH0_AUDIENCE'),
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    // Sincronizar con tu BD
    const user = await this.authService.findOrCreateUser(
      payload.sub, // Este es el auth0_id
      payload.email,
    );

    // Devuelve un objeto con la estructura que espera tu aplicación
    return {
      id: user.id, // ID de tu base de datos
      auth0Id: payload.sub,
      email: payload.email,
      rol: user.rol, // Rol de tu BD por si necesitas referencia
      permissions: payload.permissions || [], // Permisos de Auth0
    };
  }
}
