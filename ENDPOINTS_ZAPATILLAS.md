# Nuevos Endpoints de Zapatillas - API Quimera

## Endpoints Agregados

### 1. Paginación Básica

#### GET `/zapatillas/paginated/40`
Devuelve zapatillas paginadas de 40 en 40.

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `marca`: Filtrar por marca
- `modelo`: Filtrar por modelo
- `sku`: Filtrar por SKU
- `categoria`: Filtrar por categoría
- `precio_min`: Precio mínimo
- `precio_max`: Precio máximo
- `activa`: true/false (default: true)
- `search`: Búsqueda general en múltiples campos
- `sortBy`: Campo para ordenar (default: fecha_creacion)
- `sortOrder`: asc/desc (default: desc)

**Ejemplo:**
```
GET /zapatillas/paginated/40?page=1&marca=Nike&precio_min=50&precio_max=200
```

#### GET `/zapatillas/paginated/15`
Devuelve zapatillas paginadas de 15 en 15.

**Parámetros:** Los mismos que el endpoint anterior.

### 2. Búsqueda Avanzada con Filtros

#### GET `/zapatillas/search`
Búsqueda con filtros avanzados y paginación personalizable (default 15 por página).

**Parámetros de consulta:**
- `search`: Búsqueda general (busca en marca, modelo, SKU, descripción, categoría)
- `marca`: Filtrar por marca específica
- `modelo`: Filtrar por modelo específico
- `sku`: Filtrar por SKU específico
- `categoria`: Filtrar por categoría
- `precio_min`: Precio mínimo
- `precio_max`: Precio máximo
- `activa`: true/false
- `page`: Número de página
- `limit`: Elementos por página (1-100)
- `sortBy`: Campo para ordenar
- `sortOrder`: asc/desc

**Ejemplos:**
```bash
# Búsqueda general
GET /zapatillas/search?search=Nike Air Jordan

# Búsqueda específica con filtros
GET /zapatillas/search?marca=Adidas&precio_min=80&precio_max=150&page=2

# Búsqueda múltiple
GET /zapatillas/search?search=running&categoria=deportivo&sortBy=precio_min&sortOrder=asc
```

#### GET `/zapatillas/search/paginated/40`
Búsqueda con filtros, resultado de 40 en 40.

#### GET `/zapatillas/search/paginated/15` 
Búsqueda con filtros, resultado de 15 en 15.

## Respuesta de los Endpoints Paginados

Todos los endpoints paginados devuelven la siguiente estructura:

```json
{
  "data": [
    {
      "id": 1,
      "marca": "Nike",
      "modelo": "Air Jordan 1",
      "imagen": "url_imagen",
      "sku": "NIKE-AJ1-001",
      "descripcion": "Descripción de la zapatilla",
      "fecha_creacion": "2024-01-01T00:00:00.000Z",
      "activa": true,
      "categoria": "basketball",
      "precio_min": 120.50,
      "precio_max": 180.00,
      "precio_promedio": 150.25,
      "tiendas_disponibles": 3,
      "zapatillasTienda": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 156,
    "totalPages": 11,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Campos de Búsqueda

### Búsqueda General (`search`)
Busca en los siguientes campos simultáneamente:
- marca
- modelo  
- sku
- descripcion
- categoria

### Filtros Específicos
- `marca`: Búsqueda parcial en marca (case-insensitive)
- `modelo`: Búsqueda parcial en modelo (case-insensitive)
- `sku`: Búsqueda parcial en SKU (case-insensitive)
- `categoria`: Búsqueda parcial en categoría (case-insensitive)
- `precio_min/precio_max`: Filtro por rango de precios
- `activa`: Filtrar por zapatillas activas/inactivas

### Ordenamiento
Campos disponibles para `sortBy`:
- `fecha_creacion` (default)
- `marca`
- `modelo`
- `precio_min`
- `precio_max`
- `categoria`

## Casos de Uso

### 1. Búsqueda en Barra de Búsqueda
```javascript
// Usuario escribe "Nike Air Max"
GET /zapatillas/search?search=Nike Air Max&limit=15&page=1
```

### 2. Filtros Avanzados
```javascript
// Filtrar Adidas entre 50-150€, ordenar por precio
GET /zapatillas/search?marca=Adidas&precio_min=50&precio_max=150&sortBy=precio_min&sortOrder=asc
```

### 3. Catálogo Principal
```javascript
// Mostrar todas las zapatillas, 40 por página
GET /zapatillas/paginated/40?page=1
```

### 4. Búsqueda Combinada
```javascript
// Buscar "running" en zapatillas de Nike entre 80-200€
GET /zapatillas/search?search=running&marca=Nike&precio_min=80&precio_max=200
```

## Notas Técnicas

- Todas las búsquedas de texto son case-insensitive
- Por defecto solo se muestran zapatillas activas (`activa: true`)
- Los precios se calculan automáticamente desde las tiendas disponibles
- El filtro de precio busca zapatillas que tengan al menos una tienda con precio en el rango especificado
- Los resultados incluyen información agregada de precios (mín, máx, promedio)
- La paginación incluye metadatos útiles para la UI (hasNext, hasPrev, totalPages)
