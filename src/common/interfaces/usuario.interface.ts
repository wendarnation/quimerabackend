export interface UsuarioBase {
  id: number;
  auth0_id: string;
  email: string;
  rol: string;
  fecha_registro: Date;
  nombre_completo?: string | null;
  nickname?: string | null;
}

export interface UsuarioSelectFields {
  id?: boolean;
  auth0_id?: boolean;
  email?: boolean;
  rol?: boolean;
  fecha_registro?: boolean;
  nombre_completo?: boolean;
  nickname?: boolean;
  listasFavoritos?: boolean;
  comentarios?: boolean;
  valoraciones?: boolean;
}
