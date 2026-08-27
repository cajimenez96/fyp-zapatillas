import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (supports ENV_FILE=.env.prod or defaults to .env.local)
const envFile = process.env.ENV_FILE || '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import mongoose from 'mongoose';
import { Brand, FootwearType, GenderSize, Product } from '../src/models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fp-zapatillas-dev';

const PRODUCT_COUNT = 50;

const ADJECTIVES = [
  'Runner', 'Classic', 'Pro', 'Street', 'Flex', 'Ultra', 'Retro', 'Edge',
  'Motion', 'Pulse', 'Core', 'Zen', 'Trail', 'Sprint', 'Wave',
];

const GENDERS = ['Hombre', 'Mujer', 'Niño', 'Unisex'] as const;

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runSeedTestProducts() {
  try {
    console.log('====================================================');
    console.log(`🚀 SEED DE PRODUCTOS DE PRUEBA (${envFile})`);
    console.log('====================================================');
    console.log('🔄 Conectando a MongoDB en:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión establecida con éxito.\n');

    const brands = await Brand.find().lean();
    const types = await FootwearType.find().lean();
    const genderSizes = await GenderSize.find().lean();

    if (brands.length === 0 || types.length === 0) {
      throw new Error(
        'No hay marcas o tipos de calzado cargados. Corré "npm run seed" primero.',
      );
    }

    const sizesByGender = new Map(
      genderSizes.map((gs) => [gs.gender, gs.sizes]),
    );

    console.log(`📦 Generando ${PRODUCT_COUNT} productos de prueba...`);

    const newProducts = Array.from({ length: PRODUCT_COUNT }, (_, i) => {
      const brand = pick(brands, i);
      const type = pick(types, i + 1);
      const gender = pick([...GENDERS], i + 2);
      const adjective = pick(ADJECTIVES, i);
      const availableSizes = sizesByGender.get(gender) || [38, 39, 40, 41, 42];

      const retailPrice = randomInt(20, 90) * 1000;
      const wholesalePrice = Math.round(retailPrice * 0.7);

      const sizesStock = availableSizes.map((size) => ({
        size,
        stock: randomInt(0, 15),
      }));

      return {
        name: `${brand.name} ${type.name.replace('Zapatilla ', '')} ${adjective}`,
        description: `${type.description || type.name} de la línea ${adjective}, ideal para uso diario.`,
        retailPrice,
        wholesalePrice,
        brandId: brand._id,
        typeId: type._id,
        gender,
        active: true,
        images: [
          { url: pick(IMAGE_POOL, i), isPrincipal: true, position: 1 },
          { url: pick(IMAGE_POOL, i + 1), isPrincipal: false, position: 2 },
        ],
        sizesStock,
        displayedSizes: availableSizes.filter((_, idx) => idx % 2 === 0),
      };
    });

    const created = await Product.insertMany(newProducts);
    console.log(`   ✓ ${created.length} productos creados\n`);

    const total = await Product.countDocuments();
    console.log('====================================================');
    console.log('🎉 LISTO');
    console.log('====================================================');
    console.log(`📊 Total de productos en la base ahora: ${total}`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Error durante la ejecución del seed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada.');
  }
}

runSeedTestProducts();
