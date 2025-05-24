# Instrucciones para añadir Snipes a la base de datos

Para que el scraper de Snipes funcione correctamente, es necesario añadir Snipes como una tienda en la base de datos. A continuación se detallan los pasos para hacerlo:

## Método 1: Usando el script automatizado

Se ha creado un script que facilita la adición de la tienda Snipes a la base de datos:

1. Asegúrate de estar en el directorio raíz del proyecto API (apiquimera)
2. Ejecuta el siguiente comando:

```bash
npm run add:snipes
```

Este comando ejecutará el script `scripts/add-snipes-tienda.ts` que verificará si la tienda ya existe y, en caso contrario, la añadirá a la base de datos.

## Método 2: Usando la API REST (para administradores)

Si prefieres añadir la tienda usando la API REST:

1. Asegúrate de tener un token JWT válido con permisos de administrador
2. Realiza una petición POST a la ruta `/tiendas` con el siguiente cuerpo:

```json
{
  "nombre": "Snipes",
  "url": "https://www.snipes.com/es-es",
  "activa": true
}
```

Ejemplo con curl:
```bash
curl -X POST http://localhost:3000/tiendas \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Snipes","url":"https://www.snipes.com/es-es","activa":true}'
```

## Método 3: Inicializar todas las tiendas (para nuevas instalaciones)

Si estás configurando el sistema desde cero, puedes inicializar todas las tiendas predeterminadas (incluyendo Snipes) ejecutando:

```bash
npm run seed:tiendas
```

Este comando ejecutará el script `scripts/seed-tiendas.ts` que añadirá todas las tiendas predeterminadas que no existan en la base de datos.

## Verificación

Para verificar que la tienda se ha añadido correctamente, puedes:

1. Acceder a la ruta `/tiendas` de la API para ver todas las tiendas
2. Consultar directamente la base de datos con:
   ```sql
   SELECT * FROM tiendas WHERE nombre = 'Snipes';
   ```

## Configuración del ID en el scraper

Una vez añadida la tienda a la base de datos, debes asegurarte de que el ID en el scraper coincide con el de la base de datos. Para iniciar el scraper para Snipes, debes proporcionar el ID correcto de la tienda al usar el servicio de scraping.

---

Con estos pasos, el scraper de Snipes estará correctamente integrado con la base de datos y funcionará como se espera.
