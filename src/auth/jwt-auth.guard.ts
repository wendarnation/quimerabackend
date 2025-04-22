import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private jwtService: JwtService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Intenta activar el guardia de passport-jwt
    const canActivate = super.canActivate(context);

    // Si es una promesa (que es lo más probable), añade un logger y manejo de errores
    if (canActivate instanceof Promise) {
      return canActivate.catch((error) => {
        this.logger.error(
          `Error en autenticación JWT: ${error.message}`,
          error.stack,
        );

        // Para errores 401, proporcionar un mensaje más claro
        if (error instanceof UnauthorizedException) {
          throw new UnauthorizedException(
            'Sesión inválida o expirada. Por favor, inicie sesión nuevamente.',
          );
        }

        throw new UnauthorizedException('Error de autenticación');
      });
    }

    // Si no es una promesa, simplemente devuelve el resultado
    return canActivate;
  }

  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    // Interceptar antes de que passport maneje la respuesta
    if (err || !user) {
      // Registrar información detallada del error
      if (err) {
        this.logger.error(
          `Error de autenticación JWT: ${err.message}`,
          err.stack,
        );
      } else if (info) {
        this.logger.warn(`Token JWT rechazado: ${info.message}`);
      } else {
        this.logger.warn('No se encontró usuario en token JWT');
      }

      // Proporcionar mensaje de error personalizado
      throw new UnauthorizedException(
        'No autorizado. Verifique su token de acceso o inicie sesión nuevamente.',
      );
    }

    this.logger.debug(`Usuario autenticado: ${user.email}, Rol: ${user.rol}`);
    return user;
  }
}
