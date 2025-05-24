// scripts/add-snipes-tienda.ts
import { PrismaClient } from '@prisma/client';

/**
 * Script para agregar la tienda Snipes a la base de datos.
 * 
 * Ejecución: 
 * npx ts-node scripts/add-snipes-tienda.ts
 */

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar si la tienda ya existe para evitar duplicados
    const existingTienda = await prisma.tienda.findFirst({
      where: {
        nombre: {
          contains: 'Snipes',
          mode: 'insensitive'
        }
      }
    });

    if (existingTienda) {
      console.log(`La tienda Snipes ya existe con ID: ${existingTienda.id}`);
      return;
    }

    // Crear la tienda
    const newTienda = await prisma.tienda.create({
      data: {
        nombre: 'Snipes',
        url: 'https://www.snipes.com/es-es',
        activa: true
      }
    });

    console.log(`Tienda Snipes creada con éxito. ID: ${newTienda.id}`);
  } catch (error) {
    console.error('Error al crear la tienda Snipes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
