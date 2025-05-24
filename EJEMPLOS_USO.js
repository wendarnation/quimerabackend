// Ejemplos de uso de los nuevos endpoints de zapatillas

// 1. PAGINACIÓN BÁSICA (40 elementos por página)
// GET /zapatillas/paginated/40?page=1
// GET /zapatillas/paginated/40?page=2&marca=Nike

// 2. PAGINACIÓN BÁSICA (15 elementos por página)  
// GET /zapatillas/paginated/15?page=1
// GET /zapatillas/paginated/15?page=1&search=Air Jordan

// 3. BÚSQUEDA AVANZADA CON FILTROS
// Búsqueda general en múltiples campos
// GET /zapatillas/search?search=Nike Air Max

// Filtro por marca específica
// GET /zapatillas/search?marca=Adidas&page=1&limit=20

// Filtro por rango de precios
// GET /zapatillas/search?precio_min=50&precio_max=200

// Combinación de filtros
// GET /zapatillas/search?marca=Nike&modelo=Air&precio_min=100&precio_max=300

// Búsqueda + filtros + ordenamiento
// GET /zapatillas/search?search=running&categoria=deportivo&sortBy=precio_min&sortOrder=asc

// 4. BÚSQUEDA CON PAGINACIÓN FIJA
// Resultados de 40 en 40
// GET /zapatillas/search/paginated/40?search=Jordan&marca=Nike

// Resultados de 15 en 15
// GET /zapatillas/search/paginated/15?search=running&precio_max=150

/* 
RESPUESTA ESPERADA:
{
  "data": [
    {
      "id": 1,
      "marca": "Nike",
      "modelo": "Air Jordan 1 Retro High",
      "imagen": "https://example.com/image.jpg",
      "sku": "NIKE-AJ1-001",
      "descripcion": "Icónica zapatilla de basketball",
      "fecha_creacion": "2024-01-15T10:30:00.000Z",
      "activa": true,
      "categoria": "basketball",
      "precio_min": 120.99,
      "precio_max": 189.99,
      "precio_promedio": 155.49,
      "tiendas_disponibles": 3,
      "zapatillasTienda": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 125,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  }
}
*/

// CASOS DE USO FRONTEND:

// 1. Barra de búsqueda principal
const searchShoes = async (query, page = 1) => {
  const response = await fetch(`/api/zapatillas/search?search=${query}&page=${page}&limit=15`);
  return response.json();
};

// 2. Catálogo con filtros avanzados
const getFilteredShoes = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.marca) params.append('marca', filters.marca);
  if (filters.precioMin) params.append('precio_min', filters.precioMin);
  if (filters.precioMax) params.append('precio_max', filters.precioMax);
  params.append('page', filters.page || 1);
  params.append('limit', filters.limit || 15);
  
  const response = await fetch(`/api/zapatillas/search?${params}`);
  return response.json();
};

// 3. Listado principal (40 por página para desktop)
const getMainCatalog = async (page = 1) => {
  const response = await fetch(`/api/zapatillas/paginated/40?page=${page}`);
  return response.json();
};

// 4. Vista móvil (15 por página)
const getMobileCatalog = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({ page, ...filters });
  const response = await fetch(`/api/zapatillas/paginated/15?${params}`);
  return response.json();
};
