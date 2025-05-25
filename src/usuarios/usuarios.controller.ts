// src/usuarios/usuarios.controller.ts
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
  Headers,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return this.usuariosService.findOne(req.user.id);
  }

  @Get('profile/status')
  @UseGuards(JwtAuthGuard)
  getProfileStatus(@Request() req) {
    return {
      profileComplete: req.user.profileComplete,
      missingFields: {
        nombre_completo: !req.user.nombre_completo,
        nickname: !req.user.nickname,
      },
    };
  }

  @Get('profile/from-frontend')
  async getProfileFromFrontend(@Headers() headers: any) {
    try {
      // Extraer token de las cookies
      const cookies = headers.cookie;
      if (!cookies) {
        throw new Error('No se encontraron cookies');
      }

      // Buscar la cookie de Auth0 (por lo general 'appSession')
      const sessionCookie = cookies
        .split(';')
        .find((c: string) => c.trim().startsWith('appSession='));
      
      if (!sessionCookie) {
        throw new Error('Cookie de sesión no encontrada');
      }

      // Hacer una petición al frontend para obtener el token de acceso
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const tokenResponse = await fetch(`${frontendUrl}/auth/access-token`, {
        headers: { cookie: cookies },
      });

      if (!tokenResponse.ok) {
        throw new Error('No se pudo obtener el token de acceso');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token || tokenData.accessToken || tokenData.token;
      
      if (!accessToken) {
        throw new Error('Token de acceso no encontrado en la respuesta');
      }

      // Hacer una petición a nosotros mismos pero con el Bearer token
      const profileResponse = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/usuarios/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Error al obtener el perfil del usuario');
      }

      return await profileResponse.json();
    } catch (error) {
      return {
        error: true,
        message: error.message,
        rol: 'usuario' // Rol por defecto
      };
    }
  }

  // @Patch('profile')
  // @UseGuards(JwtAuthGuard)
  // updateProfile(@Request() req, @Body() updateUsuarioDto: UpdateUsuarioDto) {
  //   return this.usuariosService.updateProfile(req.user.id, updateUsuarioDto);
  // }
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    // Extraer el auth0Id del token JWT
    const auth0Id = req.user.auth0Id;

    // Buscar primero al usuario por auth0Id
    const usuario = await this.usuariosService.findByAuth0Id(auth0Id);

    // Actualizar usando el ID de la base de datos
    return this.usuariosService.updateProfile(usuario.id, updateUsuarioDto);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  removeProfile(@Request() req) {
    return this.usuariosService.remove(req.user.id);
  }

  // Endpoint para verificar rol de admin (debe ir antes de las rutas con :id)
  @Get('check-admin-role/:auth0Id')
  async checkAdminRole(@Param('auth0Id') auth0Id: string) {
    try {
      const usuario = await this.usuariosService.findByAuth0Id(auth0Id);
      return {
        isAdmin: usuario.rol === 'admin',
        rol: usuario.rol
      };
    } catch (error) {
      return {
        isAdmin: false,
        rol: 'usuario'
      };
    }
  }

  // Endpoint para cambiar rol (debe ir antes de las rutas con :id)
  @Patch('change-role/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async changeUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rol: string }
  ) {
    return this.usuariosService.update(id, { rol: body.rol });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
