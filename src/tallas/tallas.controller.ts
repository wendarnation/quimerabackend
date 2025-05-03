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
import { TallasService } from './tallas.service';
import { CreateTallaDto } from './dto/create-talla.dto';
import { UpdateTallaDto } from './dto/update-talla.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('tallas')
export class TallasController {
  constructor(private readonly tallasService: TallasService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  create(@Body() createTallaDto: CreateTallaDto) {
    return this.tallasService.create(createTallaDto);
  }

  @Get()
  findAll() {
    return this.tallasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tallasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTallaDto: UpdateTallaDto,
  ) {
    return this.tallasService.update(id, updateTallaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('admin:zapatillas')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tallasService.remove(id);
  }

  @Get('zapatilla-tienda/:id')
  findByZapatillaTiendaId(@Param('id', ParseIntPipe) id: number) {
    return this.tallasService.findByZapatillaTiendaId(id);
  }
}
