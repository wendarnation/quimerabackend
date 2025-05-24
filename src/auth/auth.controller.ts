import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from './roles.decorator';
import { Permissions } from './permissions.decorator';
import { RolesGuard } from './roles.guard';
import {
  UserPayload,
  ProfileData,
} from '../common/interfaces/usuario.interface';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('sync-user')
  @UseGuards(JwtAuthGuard)
  async syncUser(
    @Request() req: { user: UserPayload },
    @Body()
    userData: {
      email?: string;
      nombre_completo?: string | null;
      nickname?: string | null;
      rol?: string;
    },
  ) {
    try {
      // Usar el auth0Id y email del token JWT
      const auth0Id = req.user.auth0Id;
      const email = userData.email || req.user.email;

      // Verificar si es primer login para el usuario
      const isFirstLogin = req.user.first_login;
      this.logger.log(
        `Sync-user para usuario ${auth0Id}, first_login: ${isFirstLogin}`,
      );

      // Para usuarios nuevos, garantizar que tengan un rol predeterminado
      let rol = req.user.rol || 'usuario'; // Fallback a 'usuario' si no hay rol

      // Solo admins pueden cambiar roles explícitamente
      if (userData.rol) {
        if (req.user.rol !== 'admin') {
          throw new UnauthorizedException(
            'No tienes permisos para cambiar roles',
          );
        }
        rol = userData.rol;
        this.logger.log(`Cambio de rol solicitado por admin: ${rol}`);
      }

      // Buscar o crear usuario
      const user = await this.authService.findOrCreateUser(
        auth0Id,
        email,
        userData.nombre_completo || null,
        userData.nickname || null,
        rol,
      );

      // Asegurar que el rol esté sincronizado con Auth0
      // Este paso es crítico para garantizar que Auth0 tenga el rol correcto
      if (user.rol !== rol) {
        await this.authService.updateUserRole(user.id, rol);
      } else {
        // Forzar sincronización con Auth0 incluso si el rol no cambió
        await this.authService.auth0Service.updateUser(auth0Id, {
          rol: rol,
        });
      }

      // Si se proporcionaron datos de perfil y es primer login, actualizar
      if (
        (userData.nombre_completo !== undefined ||
          userData.nickname !== undefined) &&
        isFirstLogin
      ) {
        const profileData: ProfileData = {};

        if (userData.nombre_completo !== undefined) {
          profileData.nombre_completo = userData.nombre_completo;
        }

        if (userData.nickname !== undefined) {
          profileData.nickname = userData.nickname;
        }

        profileData.first_login = false;

        await this.authService.updateUserProfile(user.id, profileData);
      }

      return {
        success: true,
        user,
        profileComplete: Boolean(user.nombre_completo && user.nickname),
      };
    } catch (error) {
      this.logger.error('Error en sync-user:', error);
      // Si es un error conocido, rethrow
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      // Para otros errores, dar una respuesta más amigable
      throw new InternalServerErrorException('Error al sincronizar usuario');
    }
  }

  // Endpoint temporal para testing sin token complejo
  @Post('sync-user-mock')
  async syncUserMock(
    @Body()
    userData: {
      auth0Id: string;
      email: string;
      nombre_completo?: string | null;
      nickname?: string | null;
    },
  ) {
    try {
      this.logger.log('Sync-user-mock para:', userData.auth0Id);
      
      // Crear o encontrar usuario
      const user = await this.authService.findOrCreateUser(
        userData.auth0Id,
        userData.email,
        userData.nombre_completo || null,
        userData.nickname || null,
        'usuario',
      );

      return {
        success: true,
        user,
        profileComplete: Boolean(user.nombre_completo && user.nickname),
      };
    } catch (error) {
      this.logger.error('Error en sync-user-mock:', error);
      throw new InternalServerErrorException('Error al sincronizar usuario');
    }
  }
  @Post('sync-user-test')
  async syncUserTest(
    @Body()
    userData: {
      auth0Id: string;
      email: string;
      nombre_completo?: string | null;
      nickname?: string | null;
      rol?: string;
      permissions?: string[];
      first_login?: boolean;
    },
  ) {
    // Usar first_login proporcionado o asumir true para usuarios nuevos
    const isFirstLogin =
      userData.first_login !== undefined ? userData.first_login : true;

    // Determinar el rol basado en permisos solo si es primer login
    let rol = userData.rol || 'usuario';
    if (
      isFirstLogin &&
      userData.permissions &&
      userData.permissions.length > 0
    ) {
      rol = 'admin';
      this.logger.log('Test: Usuario con permisos, asignando rol admin');
    }

    // Versión de prueba sin autorización
    const user = await this.authService.findOrCreateUser(
      userData.auth0Id,
      userData.email,
      userData.nombre_completo || null,
      userData.nickname || null,
      rol,
    );

    // Forzar sincronización con Auth0 después de crear/encontrar el usuario
    await this.authService.auth0Service.updateUser(userData.auth0Id, {
      rol: rol,
      nombre_completo: user.nombre_completo,
      nickname: user.nickname,
    });

    return {
      success: true,
      user,
      profileComplete: Boolean(user.nombre_completo && user.nickname),
    };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Permissions('admin-zapatillas')
  async getUsers(@Request() req: { user: UserPayload }) {
    this.logger.log(
      `Solicitando lista de usuarios por: ${req.user.email}, Rol: ${req.user.rol}, Permisos: ${req.user.permissions}`,
    );

    // Obtener todos los usuarios de la base de datos
    const users = await this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        rol: true,
        nombre_completo: true,
        nickname: true,
        fecha_registro: true,
        first_login: true,
      },
      orderBy: {
        fecha_registro: 'desc',
      },
    });

    return {
      success: true,
      users,
      count: users.length,
    };
  }

  // Endpoint para verificar la autorización actual
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: { user: UserPayload }) {
    return {
      user: req.user,
      permissions: req.user.permissions || [],
      hasAdminRole: req.user.rol === 'admin',
      hasAdminZapatillasPermission: (req.user.permissions || []).includes(
        'admin-zapatillas',
      ),
    };
  }

  @Post('update-user-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Permissions('admin-zapatillas')
  async updateUserRole(
    @Request() req: { user: UserPayload },
    @Body()
    userData: {
      userId: number;
      newRole: string;
    },
  ) {
    this.logger.log(
      `Actualización de rol solicitada por: ${req.user.email}, Usuario target: ${userData.userId}, Nuevo rol: ${userData.newRole}`,
    );

    // Validar el rol proporcionado
    const validRoles = ['usuario', 'admin', 'editor', 'moderador'];
    if (!validRoles.includes(userData.newRole)) {
      throw new BadRequestException(
        `Rol inválido. Roles permitidos: ${validRoles.join(', ')}`,
      );
    }

    try {
      // Obtener el usuario de la base de datos
      const targetUser = await this.prisma.usuario.findUnique({
        where: { id: userData.userId },
      });

      if (!targetUser) {
        throw new NotFoundException(
          `Usuario con ID ${userData.userId} no encontrado`,
        );
      }

      // Actualizar el rol en la base de datos
      const updatedUser = await this.authService.updateUserRole(
        userData.userId,
        userData.newRole,
      );

      return {
        success: true,
        message: `Rol de usuario actualizado a "${userData.newRole}"`,
        user: updatedUser,
      };
    } catch (error) {
      this.logger.error('Error al actualizar rol:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar el rol del usuario',
      );
    }
  }

  // Endpoint para que los usuarios actualicen su propio perfil
  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: { user: UserPayload },
    @Body()
    profileData: {
      nombre_completo?: string | null;
      nickname?: string | null;
    },
  ) {
    const userId = req.user.id;

    try {
      // Crear objeto de datos de perfil correctamente tipado
      const updateData: ProfileData = {};

      if (profileData.nombre_completo !== undefined) {
        updateData.nombre_completo = profileData.nombre_completo;
      }

      if (profileData.nickname !== undefined) {
        updateData.nickname = profileData.nickname;
      }

      updateData.first_login = false;

      // Actualizar perfil usando el servicio centralizado
      const updatedUser = await this.authService.updateUserProfile(
        userId,
        updateData,
      );

      return {
        success: true,
        user: updatedUser,
        profileComplete: Boolean(
          updatedUser.nombre_completo && updatedUser.nickname,
        ),
      };
    } catch (error) {
      this.logger.error('Error al actualizar perfil:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el perfil');
    }
  }

  @Post('force-sync-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async forceSyncRole(
    @Body()
    userData: {
      userId: number;
      auth0Id: string;
      rol: string;
    },
  ) {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.usuario.findUnique({
        where: { id: userData.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuario con ID ${userData.userId} no encontrado`,
        );
      }

      // Actualizar el rol en Auth0
      await this.authService.auth0Service.updateUser(userData.auth0Id, {
        rol: userData.rol,
      });

      // También actualizar en la base de datos local para mantener sincronización
      await this.prisma.usuario.update({
        where: { id: userData.userId },
        data: { rol: userData.rol },
      });

      return {
        success: true,
        message: `Rol ${userData.rol} forzado en Auth0 para usuario ${userData.userId}`,
      };
    } catch (error) {
      this.logger.error('Error en force-sync-role:', error);
      throw new InternalServerErrorException(
        'Error al sincronizar rol con Auth0',
      );
    }
  }
}
