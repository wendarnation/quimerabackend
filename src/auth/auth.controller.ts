// // src/auth/auth.controller.ts
// import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
// import { JwtAuthGuard } from './jwt-auth.guard';
// import { AuthService } from './auth.service';

// @Controller('auth')
// export class AuthController {
//   constructor(private authService: AuthService) {}

//   // @Post('sync-user')
//   // @UseGuards(JwtAuthGuard)
//   // async syncUser(
//   //   @Body()
//   //   userData: {
//   //     auth0Id: string;
//   //     email: string;
//   //     nombre_completo?: string;
//   //     nickname?: string;
//   //   },
//   // ) {
//   //   const user = await this.authService.findOrCreateUser(
//   //     userData.auth0Id,
//   //     userData.email,
//   //     userData.nombre_completo || null,
//   //     userData.nickname || null,
//   //   );
//   //   return { success: true, user };
//   // }
//   @Post('sync-user')
//   // Desactiva temporalmente el guard para pruebas
//   // @UseGuards(JwtAuthGuard)
//   async syncUser(
//     @Body()
//     userData: {
//       email: string;
//       nombre_completo?: string;
//       nickname?: string;
//     },
//   ) {
//     console.log('Intentando sincronizar usuario:', userData);

//     try {
//       // Usa un ID fijo para pruebas
//       const auth0Id = 'auth0|test123';

//       // Intenta crear el usuario
//       const user = await this.authService.findOrCreateUser(
//         auth0Id,
//         userData.email,
//         userData.nombre_completo || null,
//         userData.nickname || null,
//       );

//       console.log('Usuario sincronizado exitosamente:', user);
//       return { success: true, user };
//     } catch (error) {
//       console.error('Error al sincronizar usuario:', error);
//       throw error;
//     }
//   }
// }

// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sync-user')
  @UseGuards(JwtAuthGuard) // Proteger con autenticación
  async syncUser(
    @Request() req,
    @Body()
    userData: {
      email?: string;
      nombre_completo?: string;
      nickname?: string;
    },
  ) {
    // Usar el auth0Id y email del token JWT
    const auth0Id = req.user.auth0Id;
    const email = userData.email || req.user.email;

    const user = await this.authService.findOrCreateUser(
      auth0Id,
      email,
      userData.nombre_completo || null,
      userData.nickname || null,
    );

    return {
      success: true,
      user,
      profileComplete: Boolean(user.nombre_completo && user.nickname),
    };
  }

  // Endpoint temporal para pruebas sin token
  @Post('sync-user-test')
  async syncUserTest(
    @Body()
    userData: {
      auth0Id: string;
      email: string;
      nombre_completo?: string;
      nickname?: string;
    },
  ) {
    // Versión de prueba sin autorización
    const user = await this.authService.findOrCreateUser(
      userData.auth0Id,
      userData.email,
      userData.nombre_completo || null,
      userData.nickname || null,
    );

    return {
      success: true,
      user,
      profileComplete: Boolean(user.nombre_completo && user.nickname),
    };
  }
}
