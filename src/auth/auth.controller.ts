// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sync-user')
  @UseGuards(JwtAuthGuard)
  async syncUser(@Body() userData: { auth0Id: string; email: string }) {
    const user = await this.authService.findOrCreateUser(
      userData.auth0Id,
      userData.email,
    );
    return { success: true, user };
  }
}
