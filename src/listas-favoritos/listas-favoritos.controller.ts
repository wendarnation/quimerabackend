import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ListasFavoritosService } from './listas-favoritos.service';
import { CreateListaFavoritoDto } from './dto/create-lista-favorito.dto';
import { UpdateListaFavoritoDto } from './dto/update-lista-favorito.dto';
import { AddZapatillaListaDto } from './dto/add-zapatilla-lista.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('listas-favoritos')
@UseGuards(JwtAuthGuard)
export class ListasFavoritosController {
  constructor(
    private readonly listasFavoritosService: ListasFavoritosService,
  ) {}

  @Post()
  create(
    @Request() req,
    @Body() createListaFavoritoDto: CreateListaFavoritoDto,
  ) {
    const usuarioId = req.user.id;
    return this.listasFavoritosService.create(
      usuarioId,
      createListaFavoritoDto,
    );
  }

  @Get()
  findAll(@Request() req) {
    const usuarioId = req.user.id;
    return this.listasFavoritosService.findAll(usuarioId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const usuarioId = req.user.id;
    return this.listasFavoritosService.findOne(id, usuarioId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateListaFavoritoDto: UpdateListaFavoritoDto,
  ) {
    const usuarioId = req.user.id;
    return this.listasFavoritosService.update(
      id,
      usuarioId,
      updateListaFavoritoDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const usuarioId = req.user.id;
    return this.listasFavoritosService.remove(id, usuarioId);
  }

  @Post(':id/zapatillas')
  addZapatilla(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() addZapatillaDto: AddZapatillaListaDto,
  ) {
    const usuarioId = req.user.id;
    return this.listasFavoritosService.addZapatilla(
      id,
      usuarioId,
      addZapatillaDto,
    );
  }

  @Delete(':id/zapatillas/:zapatillaId')
  removeZapatilla(
    @Param('id', ParseIntPipe) id: number,
    @Param('zapatillaId', ParseIntPipe) zapatillaId: number,
    @Request() req,
  ) {
    const usuarioId = req.user.id;
    return this.listasFavoritosService.removeZapatilla(
      id,
      zapatillaId,
      usuarioId,
    );
  }
}
