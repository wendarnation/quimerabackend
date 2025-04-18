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
import { ComentariosService } from './comentarios.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createComentarioDto: CreateComentarioDto) {
    const usuarioId = req.user.id;
    return this.comentariosService.create(usuarioId, createComentarioDto);
  }

  @Get()
  findAll() {
    return this.comentariosService.findAll();
  }

  @Get('zapatilla/:id')
  findByZapatillaId(@Param('id', ParseIntPipe) id: number) {
    return this.comentariosService.findByZapatillaId(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comentariosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateComentarioDto: UpdateComentarioDto,
  ) {
    const usuarioId = req.user.id;
    return this.comentariosService.update(id, usuarioId, updateComentarioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const usuarioId = req.user.id;
    return this.comentariosService.remove(id, usuarioId);
  }
}
