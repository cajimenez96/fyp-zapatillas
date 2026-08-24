import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (supports ENV_FILE=.env.prod or defaults to .env.local)
const envFile = process.env.ENV_FILE || '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import mongoose from 'mongoose';
import {
  Brand,
  FootwearType,
  Product,
  Promotion,
  Order,
  SalesRecord,
  Expense,
  GenderSize,
  Settings,
} from '../src/models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fp-zapatillas-dev';

async function runSeed() {
  try {
    console.log('====================================================');
    console.log(`🚀 INICIANDO RESET & SEED (${envFile})`);
    console.log('====================================================');
    console.log('🔄 Conectando a MongoDB en:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión establecida con éxito.\n');

    // 1. Limpieza total de todas las colecciones
    console.log('🧹 [1/4] Vaciando colecciones...');
    await Promise.all([
      Order.deleteMany({}),
      SalesRecord.deleteMany({}),
      Expense.deleteMany({}),
      Product.deleteMany({}),
      Promotion.deleteMany({}),
      Brand.deleteMany({}),
      FootwearType.deleteMany({}),
      GenderSize.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log('   ✓ Transaccionales (Orders, SalesRecords, Expenses) -> 0 registros');
    console.log('   ✓ Catálogo y Marketing (Products, Promotions)      -> 0 registros');
    console.log('   ✓ Maestras y Ajustes (Brands, Types, Sizes, Settings) -> Limpias\n');

    // 2. Crear Marcas Maestras
    console.log('🏷️  [2/4] Creando Marcas Base...');
    const brandsData = [
      { name: 'Nike' },
      { name: 'Adidas' },
      { name: 'Puma' },
      { name: 'New Balance' },
      { name: 'Reebok' },
      { name: 'Vans' },
      { name: 'Converse' },
      { name: 'Under Armour' },
      { name: 'Fila' },
      { name: 'Asics' },
    ];
    const createdBrands = await Brand.insertMany(brandsData);
    console.log(`   ✓ ${createdBrands.length} marcas creadas: ${brandsData.map((b) => b.name).join(', ')}\n`);

    // 3. Crear Tipos de Calzado
    console.log('👟 [3/4] Creando Tipos de Calzado...');
    const typesData = [
      { name: 'Zapatilla Running', description: 'Calzado técnico de alto rendimiento para correr' },
      { name: 'Zapatilla Urbana', description: 'Diseño casual y cómodo para uso diario' },
      { name: 'Zapatilla Deportiva', description: 'Para entrenamiento, gym y multideporte' },
      { name: 'Zapato Elegante', description: 'Calzado formal de vestir' },
      { name: 'Ojota', description: 'Calzado liviano e informal para verano' },
      { name: 'Botines', description: 'Calzado para fútbol y césped sintético' },
      { name: 'Sandalias', description: 'Calzado abierto y fresco' },
    ];
    const createdTypes = await FootwearType.insertMany(typesData);
    console.log(`   ✓ ${createdTypes.length} tipos de calzado creados: ${typesData.map((t) => t.name).join(', ')}\n`);

    // 4. Crear Escalas de Talles por Género
    console.log('📏 [4/4] Inicializando Escalas de Talles y Ajustes...');
    const genderSizesData = [
      { gender: 'Hombre', sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45] },
      { gender: 'Mujer', sizes: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42] },
      { gender: 'Niño', sizes: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35] },
      { gender: 'Unisex', sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45] },
    ];
    await GenderSize.insertMany(genderSizesData);
    console.log('   ✓ Escalas de talles creadas para Hombre, Mujer, Niño y Unisex');

    // 5. Crear Configuración General Inicial
    await Settings.create({
      storeName: 'FP Zapatillas',
      storePhone: '+5491100000000',
      storeEmail: 'contacto@fpzapatillas.com',
      businessHours: 'Lun a Sáb: 9:00 a 20:00 hs',
      whatsappInquiryMessage: 'Hola! Tengo una consulta sobre un calzado',
      instagramUrl: '',
      facebookUrl: '',
      bankAlias: 'FP.ZAPATILLAS',
      bankCbu: '0000003100010000000000',
      bankHolder: 'FP Calzados',
      bankCuit: '20-00000000-9',
      bankName: 'Banco Galicia',
      minStockAlert: 3,
      wholesaleMinPairs: 5,
      shippingInfo: 'Envíos a todo el país en 24/48hs',
    });
    console.log('   ✓ Ajustes de la tienda inicializados');

    console.log('\n====================================================');
    console.log('🎉 BASE DE DATOS RESETEADA Y LISTA PARA PRODUCCIÓN');
    console.log('====================================================');
    console.log('📊 Resumen del estado actual:');
    console.log('   - Marcas:          ', createdBrands.length);
    console.log('   - Tipos:            ', createdTypes.length);
    console.log('   - Escalas Talles:   4 géneros');
    console.log('   - Productos:        0 (listo para carga admin/CSV)');
    console.log('   - Promociones:      0 (listo para carga de banners)');
    console.log('   - Pedidos:          0');
    console.log('   - Ventas (Kardex):  0');
    console.log('   - Gastos / Caja:    0');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Error durante la ejecución del seed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada.');
  }
}

runSeed();
