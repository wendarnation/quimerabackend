import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTallaDto } from './dto/create-talla.dto';
import { UpdateTallaDto } from './dto/update-talla.dto';

@Injectable()
export class TallasService {
  constructor(private prisma: PrismaService) {}

  async create(createTallaDto: CreateTallaDto) {
    try {
      return await this.prisma.talla.create({
        data: createTallaDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe esta talla para esta relación zapatilla-tienda`,
        );
      }

      if (error.code === 'P2003') {
        throw new NotFoundException(
          `La relación zapatilla-tienda especificada no existe`,
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.talla.findMany({
      include: {
        zapatillaTienda: {
          include: {
            zapatilla: true,
            tienda: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const talla = await this.prisma.talla.findUnique({
      where: { id },
      include: {
        zapatillaTienda: {
          include: {
            zapatilla: true,
            tienda: true,
          },
        },
      },
    });

    if (!talla) {
      throw new NotFoundException(`Talla con ID ${id} no encontrada`);
    }

    return talla;
  }

  async update(id: number, updateTallaDto: UpdateTallaDto) {
    try {
      return await this.prisma.talla.update({
        where: { id },
        data: updateTallaDto,
      });
    } catch (error) {
      throw new NotFoundException(`Talla con ID ${id} no encontrada`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.talla.update({
        where: { id },
        data: { disponible: false },
      });
    } catch (error) {
      throw new NotFoundException(`Talla con ID ${id} no encontrada`);
    }
  }

  async findByZapatillaTiendaId(zapatillaTiendaId: number) {
    return this.prisma.talla.findMany({
      where: {
        zapatilla_tienda_id: zapatillaTiendaId,
      },
    });
  }
}
