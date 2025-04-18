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
  Request,
} from '@nestjs/common';
import { ValoracionesService } from './valoraciones.service';
import { CreateValoracionDto } from './dto/create-valoracion.dto';
import { UpdateValoracionDto } from './dto/update-valoracion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('valoraciones')
export class ValoracionesController {
  constructor(private readonly valoracionesService: ValoracionesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createValoracionDto: CreateValoracionDto) {
    const usuarioId = req.user.id;
    return this.valoracionesService.create(usuarioId, createValoracionDto);
  }

  @Get()
  findAll() {
    return this.valoracionesService.findAll();
  }

  @Get('zapatilla/:id')
  findByZapatillaId(@Param('id', ParseIntPipe) id: number) {
    return this.valoracionesService.findByZapatillaId(id);
  }

  @Get('zapatilla/:id/average')
  getAverageRating(@Param('id', ParseIntPipe) id: number) {
    return this.valoracionesService.getAverageRating(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.valoracionesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateValoracionDto: UpdateValoracionDto,
  ) {
    const usuarioId = req.user.id;
    return this.valoracionesService.update(id, usuarioId, updateValoracionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const usuarioId = req.user.id;
    return this.valoracionesService.remove(id, usuarioId);
  }
}
