import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class Auth0ManagementService {
  private token: string;
  private tokenExpiresAt: Date;

  constructor(private configService: ConfigService) {}

  private async getManagementApiToken() {
    if (this.token && this.tokenExpiresAt > new Date()) {
      return this.token;
    }

    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const clientId = this.configService.get<string>(
      'AUTH0_MANAGEMENT_CLIENT_ID',
    );
    const clientSecret = this.configService.get<string>(
      'AUTH0_MANAGEMENT_CLIENT_SECRET',
    );

    const response = await axios.post(`https://${domain}/oauth/token`, {
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: 'client_credentials',
    });

    this.token = response.data.access_token;
    this.tokenExpiresAt = new Date(
      Date.now() + response.data.expires_in * 1000,
    );

    return this.token;
  }

  private async getAxiosInstance() {
    const token = await this.getManagementApiToken();
    const domain = this.configService.get<string>('AUTH0_DOMAIN');

    return axios.create({
      baseURL: `https://${domain}/api/v2`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getUser(userId: string) {
    const api = await this.getAxiosInstance();
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, userData: any) {
    const api = await this.getAxiosInstance();

    // Preparar datos para Auth0
    const updateData: any = {};

    // Campos estándar de Auth0
    if (userData.email) updateData.email = userData.email;
    if (userData.nombre_completo) updateData.name = userData.nombre_completo;
    if (userData.nickname) updateData.nickname = userData.nickname;

    // También guardar en metadatos para compatibilidad
    if (userData.nombre_completo || userData.nickname) {
      updateData.user_metadata = {
        ...(userData.user_metadata || {}),
        full_name: userData.nombre_completo,
        custom_nickname: userData.nickname,
      };
    }

    const response = await api.patch(`/users/${userId}`, updateData);
    return response.data;
  }

  // async deleteUser(userId: string) {
  //   const api = await this.getAxiosInstance();
  //   await api.delete(`/users/${userId}`);
  //   return { deleted: true };
  // }
  async deleteUser(userId: string) {
    try {
      if (userId.includes('@clients')) {
        console.log(
          `Saltando eliminación en Auth0 - ID de cliente no es un usuario: ${userId}`,
        );
        return { deleted: false, reason: 'client_id_not_user' };
      }
      console.log(`Intentando eliminar usuario ${userId} de Auth0...`);
      const api = await this.getAxiosInstance();
      const response = await api.delete(`/users/${userId}`);
      console.log(`Usuario ${userId} eliminado exitosamente de Auth0`);
      return { deleted: true };
    } catch (error) {
      console.error(
        'Error al eliminar usuario en Auth0:',
        error.response?.data || error.message,
      );

      // Mostrar información de diagnóstico
      if (error.response) {
        console.error('Código de error:', error.response.status);
        console.error('Datos del error:', error.response.data);
      }

      throw new Error(`Error al eliminar usuario en Auth0: ${error.message}`);
    }
  }
}
