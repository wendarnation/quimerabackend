// src/usuarios/usuarios.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Auth0ManagementService } from '../auth/auth0-management.service';

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private auth0ManagementService: Auth0ManagementService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    // Verificar si el email ya existe
    const existingEmail = await this.prisma.usuario.findUnique({
      where: { email: createUsuarioDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar si el nickname ya existe
    if (createUsuarioDto.nickname) {
      const existingNickname = await this.prisma.usuario.findUnique({
        where: { nickname: createUsuarioDto.nickname } as any,
      });

      if (existingNickname) {
        throw new ConflictException('El nickname ya está registrado');
      }
    }

    const newUser = await this.prisma.usuario.create({
      data: {
        email: createUsuarioDto.email,
        rol: createUsuarioDto.rol || 'usuario',
        auth0_id: createUsuarioDto.auth0_id,
        nombre_completo: createUsuarioDto.nombre_completo || null,
        nickname:
          createUsuarioDto.nickname || createUsuarioDto.email.split('@')[0],
        first_login: createUsuarioDto.first_login || false,
      } as any,
    });

    // Crear una lista de favoritos predeterminada
    await this.prisma.listaFavoritos.create({
      data: {
        usuario_id: newUser.id,
        nombre: 'Favoritos',
        predeterminada: true,
      },
    });

    return await this.findOne(newUser.id);
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        rol: true,
        fecha_registro: true,
        auth0_id: true,
        nombre_completo: true,
        nickname: true,
        first_login: true,
      } as any,
    });
  }

  async findAllExcept(excludeId: number) {
    return this.prisma.usuario.findMany({
      where: {
        id: {
          not: excludeId // Excluir al usuario con este ID
        }
      },
      select: {
        id: true,
        email: true,
        rol: true,
        fecha_registro: true,
        auth0_id: true,
        nombre_completo: true,
        nickname: true,
        first_login: true,
      } as any,
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        rol: true,
        fecha_registro: true,
        auth0_id: true,
        nombre_completo: true,
        nickname: true,
        first_login: true,
        listasFavoritos: true,
        comentarios: true,
        valoraciones: true,
      } as any,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async findByEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }

    return usuario;
  }

  async findByAuth0Id(auth0Id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { auth0_id: auth0Id },
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con Auth0 ID ${auth0Id} no encontrado`,
      );
    }

    return usuario;
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    // Buscar el usuario para obtener su auth0_id
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id },
      select: { auth0_id: true },
    });

    if (!currentUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si se actualiza el email, verificar que no exista
    if (updateUsuarioDto.email) {
      const existingUser = await this.prisma.usuario.findFirst({
        where: {
          email: updateUsuarioDto.email,
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Si se actualiza el nickname, verificar que no exista
    if (updateUsuarioDto.nickname) {
      const existingNickname = await this.prisma.usuario.findFirst({
        where: {
          nickname: updateUsuarioDto.nickname,
          id: { not: id },
        } as any,
      });

      if (existingNickname) {
        throw new ConflictException('El nickname ya está registrado');
      }
    }

    try {
      // Si es primera vez que completa el perfil, establecer first_login a false
      if (updateUsuarioDto.nombre_completo || updateUsuarioDto.nickname) {
        updateUsuarioDto.first_login = false;
      }

      // Actualizar en la base de datos
      const updatedUser = await this.prisma.usuario.update({
        where: { id },
        data: updateUsuarioDto as any,
        select: {
          id: true,
          email: true,
          rol: true,
          fecha_registro: true,
          auth0_id: true,
          nombre_completo: true,
          nickname: true,
          first_login: true,
        } as any,
      });

      // Preparar datos para Auth0 (limpiando nulos)
      const authUpdateData = { ...updateUsuarioDto };

      // Eliminar propiedades nulas o indefinidas
      Object.keys(authUpdateData).forEach((key) => {
        if (authUpdateData[key] === null || authUpdateData[key] === undefined) {
          delete authUpdateData[key];
        }
      });

      // Actualizar en Auth0 solo si tenemos un auth0_id
      if (currentUser.auth0_id) {
        await this.auth0ManagementService.updateUser(
          currentUser.auth0_id,
          authUpdateData,
        );
      }

      return updatedUser;
    } catch (error) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  // async remove(id: number) {
  //   try {
  //     // Buscar el usuario para obtener su auth0_id antes de eliminarlo
  //     const user = await this.prisma.usuario.findUnique({
  //       where: { id },
  //       select: { auth0_id: true },
  //     });

  //     if (!user) {
  //       throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  //     }

  //     // Eliminar el usuario de la base de datos
  //     const deletedUser = await this.prisma.usuario.delete({
  //       where: { id },
  //     });

  //     // Eliminar el usuario de Auth0 solo si tenemos un auth0_id
  //     if (user.auth0_id) {
  //       await this.auth0ManagementService.deleteUser(user.auth0_id);
  //     }

  //     return deletedUser;
  //   } catch (error) {
  //     throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  //   }
  // }

  async remove(id: number) {
    try {
      // Buscar el usuario para obtener su auth0_id antes de eliminarlo
      const user = await this.prisma.usuario.findUnique({
        where: { id },
        select: { auth0_id: true, email: true },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      console.log(
        `Eliminando usuario ${id} (auth0_id: ${user.auth0_id}, email: ${user.email})...`,
      );

      // Eliminar el usuario de la base de datos
      const deletedUser = await this.prisma.usuario.delete({
        where: { id },
      });
      console.log(`Usuario eliminado de la base de datos`);

      // Eliminar el usuario de Auth0 solo si tenemos un auth0_id
      if (user.auth0_id) {
        try {
          await this.auth0ManagementService.deleteUser(user.auth0_id);
          console.log(`Usuario eliminado de Auth0`);
        } catch (auth0Error) {
          console.error(`Error al eliminar usuario de Auth0:`, auth0Error);
          // Decidir si quieres que un error en Auth0 haga fallar toda la operación
          // o simplemente loggearlo
        }
      } else {
        console.log(`No hay auth0_id para eliminar de Auth0`);
      }

      return {
        success: true,
        message: 'Usuario eliminado correctamente',
        user: deletedUser,
      };
    } catch (error) {
      console.error('Error en remove:', error);
      throw error;
    }
  }

  // Método para actualizar el perfil del usuario actual
  // En UsuariosService
  async updateProfile(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.prisma.usuario.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      // Si es primera vez que completa el perfil, establecer first_login a false
      if (updateUsuarioDto.nombre_completo || updateUsuarioDto.nickname) {
        updateUsuarioDto.first_login = false;
      }

      // Actualizar en la base de datos
      const updatedUser = await this.prisma.usuario.update({
        where: { id },
        data: updateUsuarioDto,
        select: {
          id: true,
          email: true,
          rol: true,
          fecha_registro: true,
          auth0_id: true,
          nombre_completo: true,
          nickname: true,
          first_login: true,
        } as any,
      });

      // Devuelve explícitamente el usuario actualizado
      return updatedUser;
    } catch (error) {
      console.error('Error en updateProfile:', error);

      // Verificar si es un error de "no encontrado"
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Para otros errores, devolver un mensaje genérico
      throw new Error(`Error al actualizar el perfil: ${error.message}`);
    }
  }

  // Método para encontrar o crear un usuario con Auth0
  async findOrCreateByAuth0Id(
    auth0Id: string,
    email: string,
    nombreCompleto: string | null = null,
    nickname: string | null = null,
  ) {
    try {
      // Intenta encontrar un usuario con el auth0_id
      return await this.findByAuth0Id(auth0Id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Si no existe, crea uno nuevo
        return this.create({
          email,
          rol: 'usuario',
          auth0_id: auth0Id,
          nombre_completo: nombreCompleto || undefined,
          nickname: nickname || undefined,
          first_login: true,
        });
      }
      throw error;
    }
  }
}
