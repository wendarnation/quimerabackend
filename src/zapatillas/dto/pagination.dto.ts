export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ZapatillaWithPrices {
  id: number;
  marca: string;
  modelo: string;
  imagen: string | null;
  sku: string;
  descripcion: string | null;
  fecha_creacion: Date;
  activa: boolean;
  categoria: string;
  precio_min?: number;
  precio_max?: number;
  precio_promedio?: number;
  tiendas_disponibles?: number;
  zapatillasTienda?: any[];
}
