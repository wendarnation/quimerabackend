import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const newUser = await this.prisma.usuario.create({
      data: {
        email: createUsuarioDto.email,
        rol: createUsuarioDto.rol || 'usuario',
        auth0_id: createUsuarioDto.auth0_id,
      },
    });

    // Crear una lista de favoritos predeterminada
    await this.prisma.listaFavoritos.create({
      data: {
        usuario_id: newUser.id,
        nombre: 'Favoritos',
        predeterminada: true,
      },
    });

    // Usar la referencia a this.findOne correctamente
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
      },
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
        listasFavoritos: true,
        comentarios: true,
        valoraciones: true,
      },
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

    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: updateUsuarioDto,
        select: {
          id: true,
          email: true,
          rol: true,
          fecha_registro: true,
          auth0_id: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.usuario.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  // Método para encontrar o crear un usuario con Auth0
  async findOrCreateByAuth0Id(auth0Id: string, email: string) {
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
        });
      }
      throw error;
    }
  }
}
