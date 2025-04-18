import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZapatillaTiendaDto } from './dto/create-zapatilla-tienda.dto';
import { UpdateZapatillaTiendaDto } from './dto/update-zapatilla-tienda.dto';

@Injectable()
export class ZapatillasTiendaService {
  constructor(private prisma: PrismaService) {}

  async create(createZapatillaTiendaDto: CreateZapatillaTiendaDto) {
    try {
      return await this.prisma.zapatillaTienda.create({
        data: {
          zapatilla_id: createZapatillaTiendaDto.zapatilla_id,
          tienda_id: createZapatillaTiendaDto.tienda_id,
          modelo_tienda: createZapatillaTiendaDto.modelo_tienda,
          precio: createZapatillaTiendaDto.precio,
          disponible: createZapatillaTiendaDto.disponible,
          url_producto: createZapatillaTiendaDto.url_producto,
        },
        include: {
          zapatilla: true,
          tienda: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe un registro para esta zapatilla y tienda`,
        );
      }

      if (error.code === 'P2003') {
        throw new NotFoundException(
          `La zapatilla o tienda especificada no existe`,
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.zapatillaTienda.findMany({
      where: {
        disponible: true,
      },
      include: {
        zapatilla: true,
        tienda: true,
        tallas: true,
      },
    });
  }

  async findOne(id: number) {
    const zapatillaTienda = await this.prisma.zapatillaTienda.findUnique({
      where: { id },
      include: {
        zapatilla: true,
        tienda: true,
        tallas: true,
      },
    });

    if (!zapatillaTienda) {
      throw new NotFoundException(
        `Relación zapatilla-tienda con ID ${id} no encontrada`,
      );
    }

    return zapatillaTienda;
  }

  async update(id: number, updateZapatillaTiendaDto: UpdateZapatillaTiendaDto) {
    try {
      return await this.prisma.zapatillaTienda.update({
        where: { id },
        data: updateZapatillaTiendaDto,
        include: {
          zapatilla: true,
          tienda: true,
          tallas: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(
        `Relación zapatilla-tienda con ID ${id} no encontrada`,
      );
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.zapatillaTienda.update({
        where: { id },
        data: { disponible: false },
      });
    } catch (error) {
      throw new NotFoundException(
        `Relación zapatilla-tienda con ID ${id} no encontrada`,
      );
    }
  }

  async findByZapatillaId(zapatillaId: number) {
    return this.prisma.zapatillaTienda.findMany({
      where: {
        zapatilla_id: zapatillaId,
        disponible: true,
      },
      include: {
        tienda: true,
        tallas: true,
      },
    });
  }

  async findByTiendaId(tiendaId: number) {
    return this.prisma.zapatillaTienda.findMany({
      where: {
        tienda_id: tiendaId,
        disponible: true,
      },
      include: {
        zapatilla: true,
        tallas: true,
      },
    });
  }
}
