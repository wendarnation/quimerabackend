import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    const permissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    this.logger.debug(
      `Verificando acceso - Roles requeridos: ${roles}, Permisos requeridos: ${permissions}`,
    );

    if (!roles && !permissions) {
      this.logger.debug(
        'No hay restricciones de roles o permisos para este endpoint',
      );
      return true; // Si no hay roles ni permisos definidos, permitir acceso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Acceso denegado: No hay usuario en el request');
      throw new UnauthorizedException('Usuario no autenticado');
    }

    this.logger.debug(
      `Usuario: ${user.email}, Rol: ${user.rol}, Permisos: ${JSON.stringify(user.permissions || [])}`,
    );

    // Verificar roles
    if (roles) {
      const hasRole = roles.some((role) => user.rol === role);
      if (hasRole) {
        this.logger.debug(`Acceso concedido por rol: ${user.rol}`);
        return true;
      }
    }

    // Verificar permisos específicos
    if (permissions) {
      const userPermissions = user.permissions || [];
      const hasPermission = permissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (hasPermission) {
        this.logger.debug(
          `Acceso concedido por permiso: ${permissions.filter((p) => userPermissions.includes(p))}`,
        );
        return true;
      }
    }

    this.logger.warn(
      `Acceso denegado para usuario ${user.email}: No cumple con roles o permisos requeridos`,
    );

    // Proporcionar un mensaje de error específico
    throw new UnauthorizedException(
      `No tiene los permisos necesarios para acceder a este recurso. Se requiere ${roles ? `rol '${roles.join("' o '")}' ` : ''}${
        roles && permissions ? 'o ' : ''
      }${permissions ? `permiso '${permissions.join("' o '")}' ` : ''}`,
    );
  }
}
