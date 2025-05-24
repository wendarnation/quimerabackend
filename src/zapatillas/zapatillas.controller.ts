// src/zapatillas/zapatillas.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ZapatillasService } from './zapatillas.service';
import { CreateZapatillaDto } from './dto/create-zapatilla.dto';
import { UpdateZapatillaDto } from './dto/update-zapatilla.dto';
import { FilterZapatillasDto } from './dto/filter-zapatillas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('zapatillas')
export class ZapatillasController {
  constructor(private readonly zapatillasService: ZapatillasService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  create(@Body() createZapatillaDto: CreateZapatillaDto) {
    // Garantizar que activa sea true incluso si se proporciona como false
    // Esta línea es redundante con el cambio en el servicio, pero añade seguridad
    createZapatillaDto.activa = true;
    return this.zapatillasService.create(createZapatillaDto);
  }

  @Get()
  findAll(@Query('marca') marca?: string, @Query('activa') activa?: boolean) {
    return this.zapatillasService.findAll({ marca, activa });
  }

  @Get('paginated/40')
  findPaginated40(
    @Query('page') page?: number,
    @Query('marca') marca?: string,
    @Query('modelo') modelo?: string,
    @Query('sku') sku?: string,
    @Query('categoria') categoria?: string,
    @Query('precio_min') precio_min?: number,
    @Query('precio_max') precio_max?: number,
    @Query('activa') activa?: boolean,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.zapatillasService.findPaginated40(page || 1, {
      marca,
      modelo,
      sku,
      categoria,
      precio_min,
      precio_max,
      activa,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('paginated/15')
  findPaginated15(
    @Query('page') page?: number,
    @Query('marca') marca?: string,
    @Query('modelo') modelo?: string,
    @Query('sku') sku?: string,
    @Query('categoria') categoria?: string,
    @Query('precio_min') precio_min?: number,
    @Query('precio_max') precio_max?: number,
    @Query('activa') activa?: boolean,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.zapatillasService.findPaginated15(page || 1, {
      marca,
      modelo,
      sku,
      categoria,
      precio_min,
      precio_max,
      activa,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('search')
  searchWithFilters(@Query() filters: FilterZapatillasDto) {
    return this.zapatillasService.findWithFiltersAndPagination(filters);
  }

  @Get('search/paginated/40')
  searchPaginated40(@Query() filters: FilterZapatillasDto) {
    filters.limit = 40;
    return this.zapatillasService.findWithFiltersAndPagination(filters);
  }

  @Get('search/paginated/15')
  searchPaginated15(@Query() filters: FilterZapatillasDto) {
    filters.limit = 15;
    return this.zapatillasService.findWithFiltersAndPagination(filters);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.zapatillasService.findBySku(sku);
  }

  @Get('buscar-exacto')
  findBySkuExacto(@Query('sku') sku: string) {
    return this.zapatillasService.findBySkuExacto(sku);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateZapatillaDto: UpdateZapatillaDto,
  ) {
    return this.zapatillasService.update(id, updateZapatillaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasService.remove(id);
  }

  @Get(':id/tiendas')
  findTiendas(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasService.findTiendas(id);
  }

  @Get(':id/tallas')
  findTallas(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasService.findTallas(id);
  }

  @Get(':id/valoraciones')
  findValoraciones(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasService.findValoraciones(id);
  }

  @Get(':id/comentarios')
  findComentarios(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasService.findComentarios(id);
  }
}
