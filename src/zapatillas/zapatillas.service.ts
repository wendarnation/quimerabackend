// src/zapatillas/zapatillas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZapatillaDto } from './dto/create-zapatilla.dto';
import { UpdateZapatillaDto } from './dto/update-zapatilla.dto';
import { FilterZapatillasDto } from './dto/filter-zapatillas.dto';
import { PaginatedResult, ZapatillaWithPrices } from './dto/pagination.dto';

@Injectable()
export class ZapatillasService {
  constructor(private prisma: PrismaService) {}

  async create(createZapatillaDto: CreateZapatillaDto) {
    // Forzar que activa sea true siempre al crear una zapatilla
    return this.prisma.zapatilla.create({
      data: {
        ...createZapatillaDto,
        activa: true, // Garantizar que siempre se cree como activa
      },
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

  /**
   * Busca una zapatilla por su SKU exacto utilizando findUnique para evitar problemas de unicidad
   */
  async findBySku(sku: string) {
    const zapatilla = await this.prisma.zapatilla.findUnique({
      where: { sku },
      include: {
        zapatillasTienda: {
          include: {
            tienda: true,
            tallas: true,
          },
        },
      },
    });

    if (!zapatilla) {
      throw new NotFoundException(`Zapatilla con SKU ${sku} no encontrada`);
    }

    return zapatilla;
  }
  
  /**
   * Busca una zapatilla por su SKU de forma exacta para API y servicios externos
   */
  async findBySkuExacto(sku: string) {
    try {
      // Buscar de forma directa y exacta usando la restricción unique
      return await this.prisma.zapatilla.findUnique({
        where: { sku },
      });
    } catch (error) {
      // Si ocurre algún error, simplemente retornar null en lugar de lanzar excepción
      return null;
    }
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

  /**
   * Buscar zapatillas con paginación y filtros avanzados
   */
  async findWithFiltersAndPagination(
    filters: FilterZapatillasDto,
  ): Promise<PaginatedResult<ZapatillaWithPrices>> {
    const {
      marca,
      modelo,
      sku,
      categoria,
      precio_min,
      precio_max,
      activa,
      search,
      page = 1,
      limit = 15,
      sortBy = 'fecha_creacion',
      sortOrder = 'desc',
    } = filters;

    // Construir el WHERE clause
    const where: any = {};

    // Filtros específicos
    if (marca) {
      where.marca = { contains: marca, mode: 'insensitive' };
    }

    if (modelo) {
      where.modelo = { contains: modelo, mode: 'insensitive' };
    }

    if (sku) {
      where.sku = { contains: sku, mode: 'insensitive' };
    }

    if (categoria) {
      where.categoria = { contains: categoria, mode: 'insensitive' };
    }

    if (activa !== undefined) {
      where.activa = activa;
    } else {
      where.activa = true; // Por defecto solo mostrar activas
    }

    // Búsqueda general en múltiples campos
    if (search) {
      // Dividir la búsqueda en palabras individuales para buscar todas juntas
      const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        // Para cada término, buscar en todos los campos
        const searchConditions = searchTerms.map(term => ({
          OR: [
            { marca: { contains: term, mode: 'insensitive' } },
            { modelo: { contains: term, mode: 'insensitive' } },
            { sku: { contains: term, mode: 'insensitive' } },
            { descripcion: { contains: term, mode: 'insensitive' } },
            { categoria: { contains: term, mode: 'insensitive' } },
          ]
        }));
        
        if (Object.keys(where).length > 0) {
          // Ya hay filtros, necesitamos combinar con AND
          const existingWhere = { ...where };
          where.AND = [
            existingWhere,
            ...searchConditions // Cada término debe coincidir (AND)
          ];
          // Limpiar las condiciones existentes del nivel raíz
          Object.keys(existingWhere).forEach(key => {
            if (key !== 'AND') delete where[key];
          });
        } else {
          // No hay otros filtros, usar AND para todos los términos
          if (searchConditions.length === 1) {
            where.OR = searchConditions[0].OR;
          } else {
            where.AND = searchConditions;
          }
        }
      }
    }

    // Filtro por precio (necesitamos hacer join con zapatillasTienda)
    if (precio_min !== undefined || precio_max !== undefined) {
      const priceFilter: any = {};
      if (precio_min !== undefined) {
        priceFilter.gte = precio_min;
      }
      if (precio_max !== undefined) {
        priceFilter.lte = precio_max;
      }

      const priceCondition = {
        zapatillasTienda: {
          some: {
            precio: priceFilter,
            disponible: true,
          },
        },
      };

      // Si ya hay condiciones AND, agregar a ellas
      if (where.AND) {
        where.AND.push(priceCondition);
      } else if (Object.keys(where).length > 0) {
        // Convertir condiciones existentes a AND
        const existingWhere = { ...where };
        where.AND = [existingWhere, priceCondition];
        // Limpiar condiciones del nivel raíz
        Object.keys(existingWhere).forEach(key => {
          if (key !== 'AND') delete where[key];
        });
      } else {
        // Primera condición
        where.zapatillasTienda = priceCondition.zapatillasTienda;
      }
    }

    // Configurar ordenamiento
    const orderBy: any = {};
    if (sortBy === 'precio_min' || sortBy === 'precio_max') {
      // Para ordenar por precio, necesitamos hacerlo después de la consulta
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calcular offset
    const skip = (page - 1) * limit;

    // Ejecutar consultas
    const [zapatillas, total] = await Promise.all([
      this.prisma.zapatilla.findMany({
        where,
        include: {
          zapatillasTienda: {
            where: { disponible: true },
            include: {
              tienda: true,
            },
          },
        },
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
        skip,
        take: limit,
      }),
      this.prisma.zapatilla.count({ where }),
    ]);

    // Enriquecer datos con información de precios
    const enrichedZapatillas: ZapatillaWithPrices[] = zapatillas.map(
      (zapatilla) => {
        const precios = zapatilla.zapatillasTienda.map((zt) =>
          parseFloat(zt.precio.toString()),
        );

        const precio_min = precios.length > 0 ? Math.min(...precios) : undefined;
        const precio_max = precios.length > 0 ? Math.max(...precios) : undefined;
        const precio_promedio =
          precios.length > 0
            ? precios.reduce((a, b) => a + b, 0) / precios.length
            : undefined;

        return {
          ...zapatilla,
          precio_min,
          precio_max,
          precio_promedio,
          tiendas_disponibles: zapatilla.zapatillasTienda.length,
        };
      },
    );

    // Ordenar por precio si es necesario
    if (sortBy === 'precio_min' || sortBy === 'precio_max') {
      enrichedZapatillas.sort((a, b) => {
        const aPrice = a[sortBy] || 0;
        const bPrice = b[sortBy] || 0;
        return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: enrichedZapatillas,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Paginación simple con 40 elementos por página
   */
  async findPaginated40(
    page: number = 1,
    filters?: Partial<FilterZapatillasDto>,
  ): Promise<PaginatedResult<ZapatillaWithPrices>> {
    return this.findWithFiltersAndPagination({
      ...filters,
      page,
      limit: 40,
    });
  }

  /**
   * Paginación simple con 15 elementos por página
   */
  async findPaginated15(
    page: number = 1,
    filters?: Partial<FilterZapatillasDto>,
  ): Promise<PaginatedResult<ZapatillaWithPrices>> {
    return this.findWithFiltersAndPagination({
      ...filters,
      page,
      limit: 15,
    });
  }
}
