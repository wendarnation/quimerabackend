import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';

@Injectable()
export class TiendasService {
  constructor(private prisma: PrismaService) {}

  async create(createTiendaDto: CreateTiendaDto) {
    return this.prisma.tienda.create({
      data: createTiendaDto,
    });
  }

  async findAll() {
    return this.prisma.tienda.findMany({
      where: {
        activa: true,
      },
    });
  }

  async findOne(id: number) {
    const tienda = await this.prisma.tienda.findUnique({
      where: { id },
      include: {
        zapatillasTienda: true,
      },
    });

    if (!tienda) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
    }

    return tienda;
  }

  async update(id: number, updateTiendaDto: UpdateTiendaDto) {
    try {
      return await this.prisma.tienda.update({
        where: { id },
        data: updateTiendaDto,
      });
    } catch (error) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.tienda.update({
        where: { id },
        data: { activa: false },
      });
    } catch (error) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
    }
  }
}
