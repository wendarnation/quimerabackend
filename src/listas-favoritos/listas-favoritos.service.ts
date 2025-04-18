import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListaFavoritoDto } from './dto/create-lista-favorito.dto';
import { UpdateListaFavoritoDto } from './dto/update-lista-favorito.dto';
import { AddZapatillaListaDto } from './dto/add-zapatilla-lista.dto';

@Injectable()
export class ListasFavoritosService {
  constructor(private prisma: PrismaService) {}

  async create(
    usuarioId: number,
    createListaFavoritoDto: CreateListaFavoritoDto,
  ) {
    // Si es predeterminada, verificar que no exista otra predeterminada
    if (createListaFavoritoDto.predeterminada) {
      const existePredeterminada = await this.prisma.listaFavoritos.findFirst({
        where: {
          usuario_id: usuarioId,
          predeterminada: true,
        },
      });

      if (existePredeterminada) {
        throw new ConflictException(
          'Ya existe una lista predeterminada para este usuario',
        );
      }
    }

    return this.prisma.listaFavoritos.create({
      data: {
        ...createListaFavoritoDto,
        usuario_id: usuarioId,
      },
    });
  }

  async findAll(usuarioId: number) {
    return this.prisma.listaFavoritos.findMany({
      where: {
        usuario_id: usuarioId,
      },
      include: {
        zapatillas: {
          include: {
            zapatilla: true,
          },
        },
      },
    });
  }

  async findOne(id: number, usuarioId: number) {
    const lista = await this.prisma.listaFavoritos.findUnique({
      where: { id },
      include: {
        zapatillas: {
          include: {
            zapatilla: {
              include: {
                zapatillasTienda: {
                  include: {
                    tienda: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lista) {
      throw new NotFoundException(
        `Lista de favoritos con ID ${id} no encontrada`,
      );
    }

    // Verificar que la lista pertenece al usuario
    if (lista.usuario_id !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta lista',
      );
    }

    return lista;
  }

  async update(
    id: number,
    usuarioId: number,
    updateListaFavoritoDto: UpdateListaFavoritoDto,
  ) {
    // Verificar que la lista existe y pertenece al usuario
    await this.findOne(id, usuarioId);

    // Si se está intentando hacer esta lista predeterminada
    if (updateListaFavoritoDto.predeterminada) {
      // Quitar el estado predeterminado de otras listas
      await this.prisma.listaFavoritos.updateMany({
        where: {
          usuario_id: usuarioId,
          predeterminada: true,
        },
        data: {
          predeterminada: false,
        },
      });
    }

    return this.prisma.listaFavoritos.update({
      where: { id },
      data: updateListaFavoritoDto,
    });
  }

  async remove(id: number, usuarioId: number) {
    const lista = await this.findOne(id, usuarioId);

    // No permitir eliminar la lista predeterminada
    if (lista.predeterminada) {
      throw new ForbiddenException(
        'No se puede eliminar la lista predeterminada',
      );
    }

    return this.prisma.listaFavoritos.delete({
      where: { id },
    });
  }

  async addZapatilla(
    listaId: number,
    usuarioId: number,
    dto: AddZapatillaListaDto,
  ) {
    // Verificar que la lista existe y pertenece al usuario
    await this.findOne(listaId, usuarioId);

    // Verificar que la zapatilla existe
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { id: dto.zapatilla_id },
    });

    if (!zapatilla) {
      throw new NotFoundException(
        `Zapatilla con ID ${dto.zapatilla_id} no encontrada`,
      );
    }

    // Verificar que la zapatilla no esté ya en la lista
    const existente = await this.prisma.listaFavoritosZapatilla.findFirst({
      where: {
        lista_id: listaId,
        zapatilla_id: dto.zapatilla_id,
      },
    });

    if (existente) {
      throw new ConflictException('La zapatilla ya está en la lista');
    }

    return this.prisma.listaFavoritosZapatilla.create({
      data: {
        lista_id: listaId,
        zapatilla_id: dto.zapatilla_id,
      },
      include: {
        zapatilla: true,
      },
    });
  }

  async removeZapatilla(
    listaId: number,
    zapatillaId: number,
    usuarioId: number,
  ) {
    // Verificar que la lista existe y pertenece al usuario
    await this.findOne(listaId, usuarioId);

    // Verificar que la zapatilla existe en la lista
    const relacion = await this.prisma.listaFavoritosZapatilla.findFirst({
      where: {
        lista_id: listaId,
        zapatilla_id: zapatillaId,
      },
    });

    if (!relacion) {
      throw new NotFoundException(
        `Zapatilla con ID ${zapatillaId} no encontrada en la lista`,
      );
    }

    return this.prisma.listaFavoritosZapatilla.delete({
      where: { id: relacion.id },
    });
  }
}
