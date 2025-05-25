import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Auth0ManagementService } from './auth0-management.service';
import { Usuario } from '@prisma/client';
import { ProfileData } from '../common/interfaces/usuario.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    public auth0Service: Auth0ManagementService,
  ) {}

  async findUserByAuth0Id(auth0Id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { auth0_id: auth0Id },
    });
  }

  async updateUserRole(userId: number, newRole: string): Promise<Usuario> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        rol: newRole,
      },
    });

    // Sincronizar con Auth0
    if (user.auth0_id) {
      try {
        // Realizar la actualización más completa en Auth0
        const updateResult = await this.auth0Service.updateUser(user.auth0_id, {
          rol: newRole,
        });

        this.logger.log(
          `Rol de usuario ${userId} actualizado a ${newRole} en Auth0`,
          updateResult,
        );

        // Intentar también actualizar roles en Auth0 a través de la asignación específica de roles
        try {
          const role = await this.auth0Service.getRoleByName(newRole);
          if (role) {
            // Primero eliminar roles existentes
            await this.auth0Service.removeRolesFromUser(user.auth0_id);
            // Luego asignar el nuevo rol
            await this.auth0Service.assignRoleToUser(user.auth0_id, role.id);
            this.logger.log(
              `Asignación directa de rol en Auth0 exitosa para usuario ${userId}`,
            );
          } else {
            this.logger.warn(`Rol '${newRole}' no encontrado en Auth0`);
          }
        } catch (roleError) {
          this.logger.error(
            'Error en la asignación directa de roles:',
            roleError,
          );
          // Continuamos a pesar del error, ya que actualizamos los metadatos anteriormente
        }
      } catch (error) {
        this.logger.error('Error al sincronizar rol con Auth0:', error);
        // No lanzamos error para permitir que la operación local sea exitosa
      }
    } else {
      this.logger.warn(
        `Usuario ${userId} no tiene auth0_id, no se puede sincronizar`,
      );
    }

    return updatedUser;
  }

  async updateUserProfile(
    userId: number,
    profileData: ProfileData,
  ): Promise<Usuario> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Si se actualiza el nickname, verificar que sea único
    if (profileData.nickname && profileData.nickname !== user.nickname) {
      const existingNickname = await this.prisma.usuario.findUnique({
        where: { nickname: profileData.nickname },
      });

      if (existingNickname) {
        throw new ConflictException('El nickname ya está en uso');
      }
    }

    // Crear objeto de datos que TypeScript pueda verificar correctamente
    const updateData: {
      nombre_completo?: string | null;
      nickname?: string | null;
      first_login?: boolean;
    } = {};

    // Solo incluir campos que están presentes en profileData
    if (profileData.nombre_completo !== undefined) {
      updateData.nombre_completo = profileData.nombre_completo;
    }

    if (profileData.nickname !== undefined) {
      updateData.nickname = profileData.nickname;
    }

    if (profileData.first_login !== undefined) {
      updateData.first_login = profileData.first_login;
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id: userId },
      data: updateData,
    });

    // Sincronizar con Auth0 si hay cambios de perfil
    if (
      user.auth0_id &&
      (profileData.nombre_completo !== undefined ||
        profileData.nickname !== undefined)
    ) {
      try {
        await this.auth0Service.updateUser(user.auth0_id, {
          nombre_completo: updatedUser.nombre_completo,
          nickname: updatedUser.nickname,
          // Incluir también el rol para garantizar sincronización completa
          rol: updatedUser.rol,
        });
        this.logger.log(`Perfil de usuario ${userId} actualizado en Auth0`);
      } catch (error) {
        this.logger.error('Error al sincronizar perfil con Auth0:', error);
      }
    }

    return updatedUser;
  }

  async createUser(
    auth0Id: string,
    email: string,
    nombreCompleto: string | null = null,
    nickname: string | null = null,
    rol: string = 'usuario',
  ): Promise<Usuario> {
    this.logger.log(`Creando nuevo usuario con rol propuesto: ${rol}`);

    // Verificar que email existe y no está vacío
    if (!email) {
      throw new BadRequestException('Email es requerido para crear un usuario');
    }

    // 🔑 CONSULTAR PRIMERO EL ROL EN AUTH0 antes de crear
    let finalRol = rol;
    try {
      const auth0User = await this.auth0Service.getUser(auth0Id);
      const auth0Role = 
        auth0User.user_metadata?.role ||
        auth0User.app_metadata?.role ||
        (auth0User.user_metadata?.roles && auth0User.user_metadata.roles[0]) ||
        null;
      
      if (auth0Role) {
        finalRol = auth0Role;
        this.logger.log(`Rol encontrado en Auth0 para nuevo usuario: ${finalRol}`);
      } else {
        this.logger.log(`No se encontró rol en Auth0, usando rol propuesto: ${finalRol}`);
      }
    } catch (auth0Error) {
      this.logger.warn(`Error al consultar Auth0 para rol del nuevo usuario: ${auth0Error.message}`);
      // Continuar con el rol propuesto si no se puede consultar Auth0
    }

    try {
      // Verificar si el email ya existe
      const existingEmail = await this.prisma.usuario.findUnique({
        where: { email: email },
      });

      if (existingEmail) {
        throw new ConflictException('El email ya está en uso');
      }

      // Preparar un nickname único
      let finalNickname = nickname;
      if (finalNickname) {
        const existingNickname = await this.prisma.usuario.findUnique({
          where: { nickname: finalNickname },
        });

        if (existingNickname) {
          throw new ConflictException('El nickname ya está en uso');
        }
      } else {
        // Preparar un nickname por defecto si no hay uno
        finalNickname =
          email && email.includes('@')
            ? email.split('@')[0]
            : `user_${Math.floor(Math.random() * 10000)}`;
      }

      // Crear nuevo usuario con typing explícito
      const newUser = await this.prisma.usuario.create({
        data: {
          email: email,
          auth0_id: auth0Id,
          rol: finalRol, // Usar el rol final (Auth0 o propuesto)
          nombre_completo: nombreCompleto,
          nickname: finalNickname,
          first_login: true,
        },
      });

      // Crear lista de favoritos predeterminada
      await this.prisma.listaFavoritos.create({
        data: {
          usuario_id: newUser.id,
          nombre: 'Favoritos',
          predeterminada: true,
        },
      });

      // Sincronizar con Auth0 inmediatamente después de la creación
      try {
        const updateResult = await this.auth0Service.updateUser(auth0Id, {
          nombre_completo: newUser.nombre_completo,
          nickname: newUser.nickname,
          rol: finalRol, // Asegurar que el rol final se sincronice
        });
        this.logger.log(
          `Usuario ${auth0Id} sincronizado con Auth0, rol: ${finalRol}`,
          updateResult,
        );

        // Intentar obtener el rol de Auth0 y asignarlo explícitamente
        try {
          const role = await this.auth0Service.getRoleByName(finalRol);
          if (role) {
            await this.auth0Service.assignRoleToUser(auth0Id, role.id);
            this.logger.log(
              `Rol ${finalRol} asignado directamente en Auth0 para usuario ${auth0Id}`,
            );
          } else {
            this.logger.warn(`Rol '${finalRol}' no encontrado en Auth0`);
          }
        } catch (roleError) {
          this.logger.error(
            'Error en la asignación directa de roles:',
            roleError,
          );
          // Continuamos a pesar del error, ya que actualizamos los metadatos anteriormente
        }
      } catch (error) {
        this.logger.error('Error al sincronizar con Auth0:', error);
      }

      return newUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException('El email o nickname ya está en uso');
      }
      throw error;
    }
  }

  async findOrCreateUser(
    auth0Id: string,
    email: string,
    nombreCompleto: string | null = null,
    nickname: string | null = null,
    rol: string = 'usuario',
  ): Promise<Usuario> {
    // Verificar si el usuario ya existe
    let existingUser: Usuario | null = null;
    try {
      existingUser = await this.findUserByAuth0Id(auth0Id);
    } catch (error) {
      this.logger.warn(`Usuario con auth0Id ${auth0Id} no encontrado`);
    }

    if (existingUser) {
      this.logger.log(
        `Usuario existente encontrado: ${existingUser.email}, rol actual: ${existingUser.rol}`,
      );

      // 🔑 NUEVA LÓGICA: Verificar si necesitamos sincronizar con Auth0
      let finalRol = existingUser.rol;
      let shouldUpdateRole = false;
      
      // Si el usuario no tiene rol en BD, consultar Auth0
      if (!existingUser.rol || existingUser.rol === null || existingUser.rol === '') {
        try {
          const auth0User = await this.auth0Service.getUser(auth0Id);
          const auth0Role = 
            auth0User.user_metadata?.role ||
            auth0User.app_metadata?.role ||
            (auth0User.user_metadata?.roles && auth0User.user_metadata.roles[0]) ||
            null;
          
          if (auth0Role) {
            finalRol = auth0Role;
            shouldUpdateRole = true;
            this.logger.log(
              `Usuario ${auth0Id} sin rol en BD, usando rol de Auth0: ${finalRol}`,
            );
          } else {
            finalRol = rol; // Usar rol proporcionado como fallback
            shouldUpdateRole = true;
            this.logger.log(
              `Usuario ${auth0Id} sin rol en BD y Auth0, asignando: ${finalRol}`,
            );
          }
        } catch (auth0Error) {
          this.logger.warn(`Error al consultar Auth0 para rol: ${auth0Error.message}`);
          finalRol = rol; // Usar rol proporcionado como fallback
          shouldUpdateRole = true;
        }
      } else {
        this.logger.log(
          `Usuario ${auth0Id} ya tiene rol '${existingUser.rol}', manteniendo rol existente`,
        );
      }

      // Si es el primer login o hay datos a actualizar o necesitamos actualizar rol
      if (
        existingUser.first_login &&
        (nombreCompleto !== null ||
          nickname !== null ||
          shouldUpdateRole)
      ) {
        const updateData: {
          nombre_completo?: string | null;
          nickname?: string | null;
          rol?: string;
          first_login: boolean;
        } = {
          first_login: false,
        };

        if (nombreCompleto !== null) {
          updateData.nombre_completo = nombreCompleto;
        }

        if (nickname !== null) {
          updateData.nickname = nickname;
        }

        // Actualizar rol si debe actualizarse
        if (shouldUpdateRole) {
          updateData.rol = finalRol;
        }

        const updatedUser = await this.prisma.usuario.update({
          where: { id: existingUser.id },
          data: updateData,
        });

        // Sincronizar siempre con Auth0 en primer login
        try {
          await this.auth0Service.updateUser(auth0Id, {
            nombre_completo: updatedUser.nombre_completo,
            nickname: updatedUser.nickname,
            rol: updatedUser.rol,
          });
          this.logger.log(
            `Usuario ${auth0Id} actualizado en Auth0 con rol ${updatedUser.rol}`,
          );

          // Asegurar que el rol también se asigne directamente
          if (updatedUser.rol !== existingUser.rol) {
            try {
              const role = await this.auth0Service.getRoleByName(
                updatedUser.rol,
              );
              if (role) {
                await this.auth0Service.removeRolesFromUser(auth0Id);
                await this.auth0Service.assignRoleToUser(auth0Id, role.id);
                this.logger.log(
                  `Rol ${updatedUser.rol} asignado directamente en Auth0`,
                );
              }
            } catch (roleError) {
              this.logger.error(
                'Error en la asignación directa de roles durante update:',
                roleError,
              );
            }
          }
        } catch (error) {
          this.logger.error(`Error sincronizando con Auth0: ${error.message}`);
        }

        return updatedUser;
      }

      // 🔑 IMPORTANTE: Para usuarios existentes, NO cambiar el rol
      // Solo devolver el usuario tal como está
      this.logger.log(
        `Usuario existente ${auth0Id} manteniendo rol actual: ${existingUser.rol}`,
      );
      return existingUser;
    }

    // Si no existe, crear nuevo usuario con rol por defecto
    this.logger.log(
      `Creando nuevo usuario con auth0Id ${auth0Id} y rol ${rol}`,
    );
    return this.createUser(auth0Id, email, nombreCompleto, nickname, rol);
  }
}
