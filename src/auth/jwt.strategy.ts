// // src/auth/jwt.strategy.ts
// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { passportJwtSecret } from 'jwks-rsa';
// import { ConfigService } from '@nestjs/config';
// import { AuthService } from './auth.service';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     private configService: ConfigService,
//     private authService: AuthService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKeyProvider: passportJwtSecret({
//         cache: true,
//         rateLimit: true,
//         jwksRequestsPerMinute: 5,
//         jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
//       }),
//       audience: configService.get('AUTH0_AUDIENCE'),
//       issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
//       algorithms: ['RS256'],
//     });
//   }

//   async validate(payload: any) {
//     // Obtener datos básicos del token
//     const auth0Id = payload.sub;
//     const email = payload.email;

//     // Obtener nombre_completo y nickname del token si existen
//     const nombreCompleto =
//       payload.name ||
//       (payload.user_metadata && payload.user_metadata.full_name) ||
//       null;
//     const nickname =
//       payload.nickname ||
//       (payload.user_metadata && payload.user_metadata.custom_nickname) ||
//       null;

//     // Sincronizar con la BD
//     const user = await this.authService.findOrCreateUser(
//       auth0Id,
//       email,
//       nombreCompleto,
//       nickname,
//     );

//     // Añade una bandera para verificar si el perfil está completo
//     const profileComplete = Boolean(user.nombre_completo && user.nickname);

//     return {
//       id: user.id, // ID de tu base de datos
//       auth0Id: payload.sub,
//       email: payload.email,
//       rol: user.rol,
//       nombre_completo: user.nombre_completo,
//       nickname: user.nickname,
//       permissions: payload.permissions || [], // Permisos de Auth0
//       profileComplete,
//     };
//   }
// }

// // src/auth/jwt.strategy.ts
// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { passportJwtSecret } from 'jwks-rsa';
// import { ConfigService } from '@nestjs/config';
// import { AuthService } from './auth.service';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     private configService: ConfigService,
//     private authService: AuthService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKeyProvider: passportJwtSecret({
//         cache: true,
//         rateLimit: true,
//         jwksRequestsPerMinute: 5,
//         jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
//       }),
//       audience: configService.get('AUTH0_AUDIENCE'),
//       issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
//       algorithms: ['RS256'],
//     });
//   }

//   async validate(payload: any) {
//     // Detectar si es un token de cliente (M2M)
//     if (payload.gty === 'client-credentials') {
//       console.log('Usando token de cliente para pruebas');

//       // Información del usuario de prueba
//       const email = 'test@test.com';
//       const auth0Id = payload.sub; // Usar el sub del token

//       // Sincronizar con la BD (esto creará o recuperará el usuario)
//       const user = await this.authService.findOrCreateUser(
//         auth0Id,
//         email,
//         null,
//         null,
//       );

//       return {
//         id: user.id,
//         auth0Id: auth0Id,
//         email: email,
//         rol: user.rol,
//         nombre_completo: user.nombre_completo,
//         nickname: user.nickname,
//         permissions: payload.permissions || [],
//         profileComplete: Boolean(user.nombre_completo && user.nickname),
//       };
//     }

//     // Código para tokens de usuario normales
//     const auth0Id = payload.sub;
//     const email = payload.email;

//     // Obtener nombre_completo y nickname del token si existen
//     const nombreCompleto =
//       payload.nombre_completo ||
//       payload.name ||
//       (payload.user_metadata && payload.user_metadata.full_name) ||
//       null;
//     const nickname =
//       payload.nickname ||
//       (payload.user_metadata && payload.user_metadata.custom_nickname) ||
//       null;

//     // Sincronizar con la BD
//     const user = await this.authService.findOrCreateUser(
//       auth0Id,
//       email,
//       nombreCompleto,
//       nickname,
//     );

//     // Añade una bandera para verificar si el perfil está completo
//     const profileComplete = Boolean(user.nombre_completo && user.nickname);

//     return {
//       id: user.id,
//       auth0Id: payload.sub,
//       email: payload.email,
//       rol: user.rol,
//       nombre_completo: user.nombre_completo,
//       nickname: user.nickname,
//       permissions: payload.permissions || [],
//       profileComplete,
//     };
//   }
// }

// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    // Verificar y obtener la audiencia configurada
    const configuredAudience = configService.get<string>('AUTH0_AUDIENCE');

    // Crear un array de audiencias válidas (sin valores undefined)
    const audiences: string[] = [];
    if (configuredAudience) {
      audiences.push(configuredAudience);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      audience: audiences, // Array de strings válidos
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    console.log('Validando token JWT:', JSON.stringify(payload, null, 2));

    // Determinar tipo de token y extraer información necesaria
    const isClientToken = payload.gty === 'client-credentials';
    const auth0Id = payload.sub;
    const email =
      payload.email || (isClientToken ? 'client@example.com' : undefined);

    // Verificaciones básicas
    if (!auth0Id) {
      throw new UnauthorizedException(
        'Token sin identificador de usuario (sub)',
      );
    }

    if (!isClientToken && !email) {
      throw new UnauthorizedException('Token de usuario sin email');
    }

    // Extraer información de perfil del token
    const nombreCompleto = isClientToken
      ? null
      : payload.nombre_completo || payload.name || null;

    const nickname = isClientToken ? null : payload.nickname || null;

    try {
      // No crear usuarios con IDs de cliente en usuarios reales
      let user;

      if (isClientToken) {
        // Para tokens de cliente, opciones:
        console.log('Usando token de cliente, ID:', auth0Id);
        user = await this.authService.findOrCreateUser(
          auth0Id,
          email || 'client@example.com',
          null,
          null,
        );
      } else {
        // Para tokens de usuario normales
        console.log('Usando token de usuario normal, ID:', auth0Id);
        user = await this.authService.findOrCreateUser(
          auth0Id,
          email || '',
          nombreCompleto,
          nickname,
        );
      }

      const profileComplete = Boolean(user.nombre_completo && user.nickname);

      return {
        id: user.id,
        auth0Id: auth0Id,
        email: email || user.email,
        rol: user.rol,
        nombre_completo: user.nombre_completo,
        nickname: user.nickname,
        permissions: payload.permissions || [],
        profileComplete,
        isClientToken, // Puede ser útil para lógica adicional
      };
    } catch (error) {
      console.error('Error en JwtStrategy.validate:', error);
      throw new UnauthorizedException('Error al procesar el usuario');
    }
  }
}
