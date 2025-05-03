import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Usuario } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

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
      audience: audiences.length > 0 ? audiences : undefined, // Evita enviar un array vacío
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    try {
      this.logger.debug(
        'Validando token JWT:',
        JSON.stringify(payload, null, 2),
      );

      // Determinar tipo de token y extraer información necesaria
      const isClientToken = payload.gty === 'client-credentials';
      const auth0Id = payload.sub;

      // Extraer email con más tolerancia a diferentes formatos de token
      let email =
        payload.email ||
        (payload.user_metadata && payload.user_metadata.email) ||
        (isClientToken ? 'client@example.com' : undefined);

      // Verificaciones más flexibles para diferentes tipos de tokens
      if (!auth0Id) {
        this.logger.error('Token sin identificador de usuario (sub)');
        throw new UnauthorizedException('Token sin identificador de usuario');
      }

      // Extraer información de perfil del token con más tolerancia
      const nombreCompleto = isClientToken
        ? null
        : payload.nombre_completo ||
          payload.name ||
          (payload.user_metadata && payload.user_metadata.full_name) ||
          null;

      const nickname = isClientToken
        ? null
        : payload.nickname ||
          (payload.user_metadata && payload.user_metadata.custom_nickname) ||
          null;

      // Extraer permisos del token con más tolerancia
      let permissions = payload.permissions || [];
      
      // Para tokens de cliente, también considerar los scopes como permisos
      if (isClientToken && payload.scope) {
        const scopes = typeof payload.scope === 'string' 
          ? payload.scope.split(' ') 
          : (Array.isArray(payload.scope) ? payload.scope : []);
        
        // Combinar permisos existentes con scopes
        permissions = [...new Set([...permissions, ...scopes])];
      }
      
      this.logger.debug('Permisos encontrados en token:', permissions);

      // Buscar usuario existente con manejo de errores adicional
      let user: Usuario | null = null;
      let isFirstLogin = false;
      let currentRol = 'usuario';

      try {
        user = await this.authService.findUserByAuth0Id(auth0Id);

        if (user) {
          this.logger.debug(
            `Usuario existente encontrado, ID: ${user.id}, Rol: ${user.rol}`,
          );
          isFirstLogin = user.first_login;
          currentRol = user.rol;

          // Si el usuario existe pero no tenemos email (raro, pero posible)
          if (!email && user.email) {
            email = user.email;
          }
        } else {
          this.logger.log(`Usuario con auth0Id ${auth0Id} no encontrado en BD`);
        }
      } catch (error) {
        this.logger.warn(
          `Error al buscar usuario por auth0Id: ${error.message}`,
        );
        // No lanzamos excepción aquí, simplemente asumimos que el usuario no existe
      }

      // Si el usuario no existe, crear uno nuevo
      if (!user) {
        if (!email) {
          this.logger.error('No se pudo determinar email para usuario nuevo');
          throw new UnauthorizedException(
            'Token sin información de email para usuario nuevo',
          );
        }

        this.logger.log('Usuario no encontrado, creando nuevo usuario');
        isFirstLogin = true;

        // Determinar rol inicial solo para usuarios nuevos
        if (isClientToken) {
          currentRol = 'sistema';
        } else if (permissions && permissions.length > 0) {
          this.logger.log('Usuario nuevo con permisos, asignando rol admin');
          currentRol = 'admin';
        }

        try {
          user = await this.authService.createUser(
            auth0Id,
            email,
            nombreCompleto,
            nickname,
            currentRol,
          );
        } catch (createError) {
          this.logger.error(`Error al crear usuario: ${createError.message}`);

          // Intentar otra búsqueda por si existe pero hubo un error previo
          try {
            user = await this.authService.findUserByAuth0Id(auth0Id);
            if (!user) {
              throw createError; // Re-lanzar el error original si aún no encontramos al usuario
            }

            this.logger.log(
              `Usuario encontrado en segundo intento: ${user.id}`,
            );
            isFirstLogin = user.first_login;
            currentRol = user.rol;
          } catch (secondError) {
            this.logger.error(
              `Error en segundo intento: ${secondError.message}`,
            );
            throw new UnauthorizedException(
              'Error al crear o encontrar usuario',
            );
          }
        }
      } else {
        // Solo actualizar rol en primer login si tiene permisos y no es ya admin
        if (isFirstLogin && permissions.length > 0 && user.rol !== 'admin') {
          this.logger.log('Primer login con permisos, actualizando a admin');
          try {
            user = await this.authService.updateUserRole(user.id, 'admin');
            currentRol = 'admin';
          } catch (updateError) {
            this.logger.error(
              `Error al actualizar rol: ${updateError.message}`,
            );
            // Continuamos con el rol actual en caso de error
          }
        }
      }

      const profileComplete = Boolean(user.nombre_completo && user.nickname);

      // Construir el objeto de usuario para el request
      return {
        id: user.id,
        auth0Id: auth0Id,
        email: email || user.email,
        rol: currentRol,
        nombre_completo: user.nombre_completo,
        nickname: user.nickname,
        permissions: permissions,
        profileComplete,
        isClientToken,
        first_login: isFirstLogin,
      };
    } catch (error) {
      this.logger.error(
        `Error en JwtStrategy.validate: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Error al procesar el usuario');
    }
  }
}
