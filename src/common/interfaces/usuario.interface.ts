// Crear archivo src/auth/interfaces/usuario.interface.ts
export interface UserPayload {
  id: number;
  auth0Id: string;
  email: string;
  rol: string;
  nombre_completo: string | null;
  nickname: string | null;
  permissions: string[];
  profileComplete: boolean;
  isClientToken: boolean;
  first_login: boolean;
}

export interface ProfileData {
  nombre_completo?: string | null;
  nickname?: string | null;
  first_login?: boolean;
}
