import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateUser(auth0Id: string, email: string) {
    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { auth0_id: auth0Id },
    });

    if (existingUser) {
      return existingUser; // Si el usuario ya existe, simplemente lo devuelve
    }

    // Si no existe, crear nuevo usuario
    return this.prisma.$transaction(async (tx) => {
      // Crear nuevo usuario
      const newUser = await tx.usuario.create({
        data: {
          email,
          auth0_id: auth0Id,
          rol: 'usuario',
        },
      });

      // Crear lista de favoritos predeterminada
      await tx.listaFavoritos.create({
        data: {
          usuario_id: newUser.id,
          nombre: 'Favoritos',
          predeterminada: true,
        },
      });

      return newUser;
    });
  }
}
