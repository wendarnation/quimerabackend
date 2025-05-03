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
} from '@nestjs/common';
import { ZapatillasTiendaService } from './zapatillas-tienda.service';
import { CreateZapatillaTiendaDto } from './dto/create-zapatilla-tienda.dto';
import { UpdateZapatillaTiendaDto } from './dto/update-zapatilla-tienda.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('zapatillas-tienda')
export class ZapatillasTiendaController {
  constructor(
    private readonly zapatillasTiendaService: ZapatillasTiendaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  create(@Body() createZapatillaTiendaDto: CreateZapatillaTiendaDto) {
    return this.zapatillasTiendaService.create(createZapatillaTiendaDto);
  }

  @Get()
  findAll() {
    return this.zapatillasTiendaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasTiendaService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateZapatillaTiendaDto: UpdateZapatillaTiendaDto,
  ) {
    return this.zapatillasTiendaService.update(id, updateZapatillaTiendaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasTiendaService.remove(id);
  }

  @Get('zapatilla/:id')
  findByZapatillaId(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasTiendaService.findByZapatillaId(id);
  }

  @Get('tienda/:id')
  findByTiendaId(@Param('id', ParseIntPipe) id: number) {
    return this.zapatillasTiendaService.findByTiendaId(id);
  }
}
