import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class Auth0ManagementService {
  private token: string;
  private tokenExpiresAt: Date;
  private readonly logger = new Logger(Auth0ManagementService.name);

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

    try {
      this.logger.debug('Obteniendo nuevo token para Auth0 Management API');
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

      this.logger.debug('Token de Auth0 Management API obtenido correctamente');
      return this.token;
    } catch (error) {
      this.logger.error(
        'Error al obtener token de Auth0 Management API:',
        error.response?.data || error.message,
      );
      throw error;
    }
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
    try {
      const api = await this.getAxiosInstance();
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error al obtener usuario ${userId} de Auth0:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async getRoles() {
    try {
      const api = await this.getAxiosInstance();
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error al obtener roles de Auth0:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async getRoleByName(roleName: string) {
    try {
      const roles = await this.getRoles();
      const role = roles.find(
        (r) => r.name.toLowerCase() === roleName.toLowerCase(),
      );

      if (!role) {
        this.logger.warn(`Rol "${roleName}" no encontrado en Auth0`);
      } else {
        this.logger.debug(
          `Rol "${roleName}" encontrado en Auth0, ID: ${role.id}`,
        );
      }

      return role;
    } catch (error) {
      this.logger.error('Error al buscar rol por nombre:', error);
      return null;
    }
  }

  async getUserRoles(userId: string) {
    try {
      const api = await this.getAxiosInstance();
      const response = await api.get(`/users/${userId}/roles`);
      this.logger.debug(`Roles actuales del usuario ${userId}:`, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error al obtener roles del usuario ${userId}:`,
        error.response?.data || error.message,
      );
      return [];
    }
  }

  async assignRoleToUser(userId: string, roleId: string) {
    try {
      const api = await this.getAxiosInstance();

      // Verificar si el usuario ya tiene este rol asignado
      const userRoles = await this.getUserRoles(userId);
      if (userRoles.some((role) => role.id === roleId)) {
        this.logger.log(
          `El usuario ${userId} ya tiene el rol ${roleId} asignado`,
        );
        return { message: 'Role already assigned' };
      }

      const response = await api.post(`/users/${userId}/roles`, {
        roles: [roleId],
      });
      this.logger.log(`Rol ${roleId} asignado al usuario ${userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error al asignar rol al usuario:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async removeRolesFromUser(userId: string) {
    try {
      // Primero obtenemos los roles actuales del usuario
      const api = await this.getAxiosInstance();
      const userRoles = await api.get(`/users/${userId}/roles`);

      if (userRoles.data && userRoles.data.length > 0) {
        // Si el usuario tiene roles, los eliminamos
        const roleIds = userRoles.data.map((role) => role.id);
        this.logger.debug(
          `Eliminando roles ${roleIds.join(', ')} del usuario ${userId}`,
        );

        await api.delete(`/users/${userId}/roles`, {
          data: { roles: roleIds },
        });
        this.logger.log(`Roles eliminados del usuario ${userId}`);
      } else {
        this.logger.debug(`El usuario ${userId} no tiene roles para eliminar`);
      }
      return true;
    } catch (error) {
      this.logger.error(
        'Error al eliminar roles del usuario:',
        error.response?.data || error.message,
      );
      return false;
    }
  }

  async updateUser(userId: string, userData: any) {
    try {
      const api = await this.getAxiosInstance();

      // Preparar datos para Auth0
      const updateData: any = {};

      // Campos estándar de Auth0
      if (userData.email) updateData.email = userData.email;
      if (userData.nombre_completo) updateData.name = userData.nombre_completo;
      if (userData.nickname) updateData.nickname = userData.nickname;

      // Verificar si ya existen metadatos o crear objeto vacío
      try {
        const currentUser = await this.getUser(userId);
        updateData.user_metadata = {
          ...(currentUser.user_metadata || {}),
        };
      } catch (error) {
        this.logger.warn(
          `No se pudo obtener metadatos actuales del usuario ${userId}, creando nuevo objeto`,
        );
        updateData.user_metadata = {};
      }

      // También guardar en metadatos para compatibilidad
      if (userData.nombre_completo) {
        updateData.user_metadata.full_name = userData.nombre_completo;
      }

      if (userData.nickname) {
        updateData.user_metadata.custom_nickname = userData.nickname;
      }

      // IMPORTANTE: Asegurarse de que el rol se incluya en los metadatos
      if (userData.rol) {
        updateData.user_metadata.role = userData.rol;
      }

      this.logger.log(`Actualizando usuario ${userId} en Auth0:`, updateData);

      try {
        const response = await api.patch(`/users/${userId}`, updateData);
        this.logger.log(`Usuario ${userId} actualizado en Auth0 correctamente`);

        // Si se proporcionó un rol, actualizar los roles de Auth0
        if (userData.rol) {
          try {
            // 1. Obtener el ID del rol según su nombre
            const role = await this.getRoleByName(userData.rol);

            if (role) {
              // 2. Quitar roles existentes
              await this.removeRolesFromUser(userId);

              // 3. Asignar el nuevo rol
              await this.assignRoleToUser(userId, role.id);
              this.logger.log(
                `Rol '${userData.rol}' asignado correctamente al usuario ${userId}`,
              );
            } else {
              this.logger.warn(`Rol '${userData.rol}' no encontrado en Auth0`);
            }
          } catch (roleError) {
            this.logger.error('Error al actualizar roles en Auth0:', roleError);
            // Continuar a pesar del error en roles
          }
        }

        return response.data;
      } catch (error) {
        this.logger.error(
          `Error al actualizar usuario ${userId} en Auth0:`,
          error.response?.data || error.message,
        );
        throw error;
      }
    } catch (error) {
      this.logger.error('Error al preparar actualización de Auth0:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      if (userId.includes('@clients')) {
        this.logger.log(
          `Saltando eliminación en Auth0 - ID de cliente no es un usuario: ${userId}`,
        );
        return { deleted: false, reason: 'client_id_not_user' };
      }
      this.logger.log(`Intentando eliminar usuario ${userId} de Auth0...`);
      const api = await this.getAxiosInstance();
      const response = await api.delete(`/users/${userId}`);
      this.logger.log(`Usuario ${userId} eliminado exitosamente de Auth0`);
      return { deleted: true };
    } catch (error) {
      this.logger.error(
        'Error al eliminar usuario en Auth0:',
        error.response?.data || error.message,
      );

      // Mostrar información de diagnóstico
      if (error.response) {
        this.logger.error('Código de error:', error.response.status);
        this.logger.error('Datos del error:', error.response.data);
      }

      throw new Error(`Error al eliminar usuario en Auth0: ${error.message}`);
    }
  }
}
