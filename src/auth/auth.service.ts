// // // src/auth/auth.service.ts
// import {
//   Injectable,
//   ConflictException,
//   BadRequestException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class AuthService {
//   constructor(private prisma: PrismaService) {}

//   async findOrCreateUser(
//     auth0Id: string,
//     email: string,
//     nombreCompleto: string | null = null,
//     nickname: string | null = null,
//   ) {
//     console.log('=== Iniciando findOrCreateUser ===');
//     console.log(
//       `Parámetros: auth0Id=${auth0Id}, email=${email}, nombreCompleto=${nombreCompleto}, nickname=${nickname}`,
//     );

//     // Verificar que email existe y no está vacío
//     if (!email) {
//       throw new BadRequestException('Email es requerido para crear un usuario');
//     }

//     try {
//       // Verificar todos los usuarios existentes
//       const allUsers = await this.prisma.usuario.findMany();
//       console.log('Todos los usuarios en BD:', allUsers);

//       // Verificar si el usuario ya existe por auth0_id
//       const existingUserByAuth0 = await this.prisma.usuario.findUnique({
//         where: { auth0_id: auth0Id },
//       });
//       console.log('Usuario existente por auth0_id:', existingUserByAuth0);

//       if (existingUserByAuth0) {
//         console.log('Usuario encontrado por auth0_id, retornando...');
//         return existingUserByAuth0;
//       }

//       // Verificar si el email ya existe
//       const existingEmail = await this.prisma.usuario.findUnique({
//         where: { email: email },
//       });
//       console.log('Usuario existente por email:', existingEmail);

//       if (existingEmail) {
//         console.log('Conflicto: Email ya existe');
//         throw new ConflictException('El email o nickname ya está en uso');
//       }

//       // Verificar si el nickname ya existe (solo si se proporciona uno)
//       let finalNickname = nickname;
//       if (finalNickname) {
//         const existingNickname = await this.prisma.usuario.findUnique({
//           where: { nickname: finalNickname } as any,
//         });
//         console.log('Usuario existente por nickname:', existingNickname);

//         if (existingNickname) {
//           console.log('Conflicto: Nickname ya existe');
//           throw new ConflictException('El email o nickname ya está en uso');
//         }
//       } else {
//         // Preparar un nickname por defecto si no hay uno
//         finalNickname =
//           email && email.includes('@')
//             ? email.split('@')[0]
//             : `user_${Math.floor(Math.random() * 10000)}`;
//         console.log('Nickname generado:', finalNickname);
//       }

//       // Si no existe, crear nuevo usuario
//       console.log('Creando nuevo usuario...');
//       try {
//         const newUser = await this.prisma.usuario.create({
//           data: {
//             email: email,
//             auth0_id: auth0Id,
//             rol: 'usuario',
//             nombre_completo: nombreCompleto,
//             nickname: finalNickname,
//             first_login: true,
//           } as any,
//         });
//         console.log('Usuario creado:', newUser);

//         // Crear lista de favoritos predeterminada
//         console.log('Creando lista de favoritos predeterminada...');
//         const lista = await this.prisma.listaFavoritos.create({
//           data: {
//             usuario_id: newUser.id,
//             nombre: 'Favoritos',
//             predeterminada: true,
//           },
//         });
//         console.log('Lista de favoritos creada:', lista);

//         return newUser;
//       } catch (createError) {
//         console.error(
//           'Error al crear usuario o lista de favoritos:',
//           createError,
//         );
//         throw createError;
//       }
//     } catch (error) {
//       console.error('Error en findOrCreateUser:', error);
//       throw error;
//     }
//   }
// }

// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateUser(
    auth0Id: string,
    email: string,
    nombreCompleto: string | null = null,
    nickname: string | null = null,
  ) {
    // Verificar que email existe y no está vacío
    if (!email) {
      throw new BadRequestException('Email es requerido para crear un usuario');
    }

    try {
      // Verificar si el usuario ya existe por auth0_id
      const existingUserByAuth0 = await this.prisma.usuario.findUnique({
        where: { auth0_id: auth0Id },
      });

      if (existingUserByAuth0) {
        // Si el usuario ya existe, actualizar información si se proporcionó
        if (nombreCompleto || nickname) {
          return this.prisma.usuario.update({
            where: { id: existingUserByAuth0.id },
            data: {
              nombre_completo:
                nombreCompleto || existingUserByAuth0.nombre_completo,
              nickname: nickname || existingUserByAuth0.nickname,
              first_login: false, // Ya no es primer login si se actualiza el perfil
            } as any,
          });
        }
        return existingUserByAuth0;
      }

      // Verificar si el email ya existe
      const existingEmail = await this.prisma.usuario.findUnique({
        where: { email: email },
      });

      if (existingEmail) {
        throw new ConflictException('El email ya está en uso');
      }

      // Verificar si el nickname ya existe (solo si se proporciona uno)
      let finalNickname = nickname;
      if (finalNickname) {
        const existingNickname = await this.prisma.usuario.findUnique({
          where: { nickname: finalNickname } as any,
        });

        if (existingNickname) {
          throw new ConflictException('El nickname ya está en uso');
        }
      } else {
        // Preparar un nickname por defecto si no hay uno
        finalNickname =
          email && email.includes('@')
            ? email.split('@')[0]
            : `user_${Math.floor(Math.random() * 10000)}`;
      }

      // Crear nuevo usuario
      const newUser = await this.prisma.usuario.create({
        data: {
          email: email,
          auth0_id: auth0Id,
          rol: 'usuario',
          nombre_completo: nombreCompleto,
          nickname: finalNickname,
          first_login: true,
        } as any,
      });

      // Verificar y eliminar listas huérfanas por precaución
      await this.prisma.listaFavoritos.deleteMany({
        where: {
          usuario_id: newUser.id,
        },
      });

      // Crear lista de favoritos predeterminada
      await this.prisma.listaFavoritos.create({
        data: {
          usuario_id: newUser.id,
          nombre: 'Favoritos',
          predeterminada: true,
        },
      });

      return newUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException('El email o nickname ya está en uso');
      }
      throw error;
    }
  }
}
