// src/zapatillas/zapatillas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZapatillaDto } from './dto/create-zapatilla.dto';
import { UpdateZapatillaDto } from './dto/update-zapatilla.dto';

@Injectable()
export class ZapatillasService {
  constructor(private prisma: PrismaService) {}

  async create(createZapatillaDto: CreateZapatillaDto) {
    return this.prisma.zapatilla.create({
      data: createZapatillaDto,
    });
  }

  async findAll(params: { marca?: string; activa?: boolean }) {
    const { marca, activa } = params;
    const where: any = {};

    if (marca) {
      where.marca = { contains: marca, mode: 'insensitive' };
    }

    if (activa !== undefined) {
      where.activa = activa;
    } else {
      where.activa = true; // Por defecto solo mostrar activas
    }

    return this.prisma.zapatilla.findMany({
      where,
      include: {
        zapatillasTienda: {
          include: {
            tienda: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id },
      include: {
        zapatillasTienda: {
          include: {
            tienda: true,
            tallas: true,
          },
        },
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        valoraciones: {
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!zapatilla) {
      throw new NotFoundException(`Zapatilla con ID ${id} no encontrada`);
    }

    return zapatilla;
  }

  async update(id: number, updateZapatillaDto: UpdateZapatillaDto) {
    try {
      return await this.prisma.zapatilla.update({
        where: { id },
        data: updateZapatillaDto,
      });
    } catch (error) {
      throw new NotFoundException(`Zapatilla con ID ${id} no encontrada`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.zapatilla.update({
        where: { id },
        data: { activa: false },
      });
    } catch (error) {
      throw new NotFoundException(`Zapatilla con ID ${id} no encontrada`);
    }
  }

  async findTiendas(id: number) {
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id },
      include: {
        zapatillasTienda: {
          include: {
            tienda: true,
          },
        },
      },
    });

    if (!zapatilla) {
      throw new NotFoundException(`Zapatilla con ID ${id} no encontrada`);
    }

    return zapatilla.zapatillasTienda.map((zt) => ({
      ...zt.tienda,
      precio: zt.precio,
      disponible: zt.disponible,
      url_producto: zt.url_producto,
    }));
  }

  async findTallas(id: number) {
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id },
      include: {
        zapatillasTienda: {
          include: {
            tallas: true,
            tienda: true,
          },
        },
      },
    });

    if (!zapatilla) {
      throw new NotFoundException(`Zapatilla con ID ${id} no encontrada`);
    }

    const result: Array<{
      id: number;
      talla: string;
      disponible: boolean;
      tienda_nombre: string;
      tienda_id: number;
      precio: any;
      fecha_actualizacion: Date;
    }> = [];

    zapatilla.zapatillasTienda.forEach((zt) => {
      if (zt.tallas && Array.isArray(zt.tallas)) {
        zt.tallas.forEach((tallItem) => {
          result.push({
            id: tallItem.id,
            talla: tallItem.talla,
            disponible: tallItem.disponible,
            tienda_nombre: zt.tienda.nombre,
            tienda_id: zt.tienda.id,
            precio: zt.precio,
            fecha_actualizacion: tallItem.fecha_actualizacion,
          });
        });
      }
    });

    return result;
  }

  async findValoraciones(id: number) {
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id },
      include: {
        valoraciones: {
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!zapatilla) {
      throw new NotFoundException(`Zapatilla con ID ${id} no encontrada`);
    }

    // Calcular la puntuación media
    const valoraciones = zapatilla.valoraciones;
    const totalValoraciones = valoraciones.length;
    const puntuacionMedia =
      totalValoraciones > 0
        ? valoraciones.reduce((acc, val) => acc + val.puntuacion, 0) /
          totalValoraciones
        : 0;

    return {
      valoraciones: valoraciones,
      stats: {
        total: totalValoraciones,
        media: puntuacionMedia,
      },
    };
  }

  async findComentarios(id: number) {
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id },
      include: {
        comentarios: {
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
        },
      },
    });

    if (!zapatilla) {
      throw new NotFoundException(`Zapatilla con ID ${id} no encontrada`);
    }

    return zapatilla.comentarios;
  }
}
