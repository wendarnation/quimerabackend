import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateValoracionDto } from './dto/create-valoracion.dto';
import { UpdateValoracionDto } from './dto/update-valoracion.dto';

@Injectable()
export class ValoracionesService {
  constructor(private prisma: PrismaService) {}

  async create(usuarioId: number, createValoracionDto: CreateValoracionDto) {
    // Verificar que la zapatilla existe
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id: createValoracionDto.zapatilla_id },
    });

    if (!zapatilla) {
      throw new NotFoundException(
        `Zapatilla con ID ${createValoracionDto.zapatilla_id} no encontrada`,
      );
    }

    // Verificar si el usuario ya valoró esta zapatilla
    const existingValoracion = await this.prisma.valoracion.findFirst({
      where: {
        zapatilla_id: createValoracionDto.zapatilla_id,
        usuario_id: usuarioId,
      },
    });

    if (existingValoracion) {
      throw new ConflictException('Ya has valorado esta zapatilla');
    }

    return this.prisma.valoracion.create({
      data: {
        zapatilla_id: createValoracionDto.zapatilla_id,
        usuario_id: usuarioId,
        puntuacion: createValoracionDto.puntuacion,
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
    return this.prisma.valoracion.findMany({
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
    return this.prisma.valoracion.findMany({
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
    });
  }

  async findOne(id: number) {
    const valoracion = await this.prisma.valoracion.findUnique({
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

    if (!valoracion) {
      throw new NotFoundException(`Valoración con ID ${id} no encontrada`);
    }

    return valoracion;
  }

  async update(
    id: number,
    usuarioId: number,
    updateValoracionDto: UpdateValoracionDto,
  ) {
    const valoracion = await this.findOne(id);

    if (valoracion.usuario_id !== usuarioId) {
      throw new ConflictException(
        'No tienes permiso para actualizar esta valoración',
      );
    }

    return this.prisma.valoracion.update({
      where: { id },
      data: updateValoracionDto,
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
    const valoracion = await this.findOne(id);

    if (valoracion.usuario_id !== usuarioId) {
      throw new ConflictException(
        'No tienes permiso para eliminar esta valoración',
      );
    }

    return this.prisma.valoracion.delete({
      where: { id },
    });
  }

  async getAverageRating(zapatillaId: number) {
    const aggregations = await this.prisma.valoracion.aggregate({
      where: {
        zapatilla_id: zapatillaId,
      },
      _avg: {
        puntuacion: true,
      },
      _count: {
        puntuacion: true,
      },
    });

    return {
      zapatilla_id: zapatillaId,
      average: aggregations._avg.puntuacion || 0,
      count: aggregations._count.puntuacion || 0,
    };
  }
}
