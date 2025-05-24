// scripts/seed-tiendas.ts
import { PrismaClient } from '@prisma/client';

/**
 * Script para poblar la base de datos con las tiendas predeterminadas.
 * Esto es útil para inicializar la base de datos en un nuevo despliegue.
 * 
 * Ejecución: 
 * npx ts-node scripts/seed-tiendas.ts
 */

const prisma = new PrismaClient();

// Lista de tiendas predeterminadas
const tiendasPredeterminadas = [
  {
    nombre: 'JD Sports',
    url: 'https://www.jdsports.es',
    activa: true
  },
  {
    nombre: 'Footlocker',
    url: 'https://www.footlocker.es',
    activa: true
  },
  {
    nombre: 'Snipes',
    url: 'https://www.snipes.com/es-es',
    activa: true
  }
  // Añadir más tiendas aquí según sea necesario
];

async function main() {
  console.log('Iniciando población de tiendas...');

  for (const tiendaData of tiendasPredeterminadas) {
    try {
      // Verificar si la tienda ya existe
      const existingTienda = await prisma.tienda.findFirst({
        where: {
          nombre: {
            contains: tiendaData.nombre,
            mode: 'insensitive'
          }
        }
      });

      if (existingTienda) {
        console.log(`La tienda ${tiendaData.nombre} ya existe con ID: ${existingTienda.id}`);
        continue;
      }

      // Crear la tienda si no existe
      const newTienda = await prisma.tienda.create({
        data: tiendaData
      });

      console.log(`Tienda ${tiendaData.nombre} creada con éxito. ID: ${newTienda.id}`);
    } catch (error) {
      console.error(`Error al crear la tienda ${tiendaData.nombre}:`, error);
    }
  }

  console.log('Población de tiendas completada.');
}

main()
  .catch((e) => {
    console.error('Error en el proceso de población:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
