import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';

@Injectable()
export class ComentariosService {
  constructor(private prisma: PrismaService) {}

  async create(usuarioId: number, createComentarioDto: CreateComentarioDto) {
    // Verificar que la zapatilla existe
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id: createComentarioDto.zapatilla_id },
    });

    if (!zapatilla) {
      throw new NotFoundException(
        `Zapatilla con ID ${createComentarioDto.zapatilla_id} no encontrada`,
      );
    }

    return this.prisma.comentario.create({
      data: {
        zapatilla_id: createComentarioDto.zapatilla_id,
        usuario_id: usuarioId,
        texto: createComentarioDto.texto,
      },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
          },
        },
        zapatilla: true,
      },
    });
  }

  async findAll() {
    return this.prisma.comentario.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
          },
        },
        zapatilla: true,
      },
    });
  }

  async findByZapatillaId(zapatillaId: number) {
    return this.prisma.comentario.findMany({
      where: {
        zapatilla_id: zapatillaId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const comentario = await this.prisma.comentario.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
          },
        },
        zapatilla: true,
      },
    });

    if (!comentario) {
      throw new NotFoundException(`Comentario con ID ${id} no encontrado`);
    }

    return comentario;
  }

  async update(
    id: number,
    usuarioId: number,
    updateComentarioDto: UpdateComentarioDto,
  ) {
    const comentario = await this.findOne(id);

    if (comentario.usuario_id !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permiso para editar este comentario',
      );
    }

    return this.prisma.comentario.update({
      where: { id },
      data: updateComentarioDto,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
          },
        },
        zapatilla: true,
      },
    });
  }

  async remove(id: number, usuarioId: number) {
    const comentario = await this.findOne(id);

    if (comentario.usuario_id !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este comentario',
      );
    }

    return this.prisma.comentario.delete({
      where: { id },
    });
  }
}
