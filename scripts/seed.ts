import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (defaults to .env.local or specified by ENV_FILE)
const envFile = process.env.ENV_FILE || '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import mongoose from 'mongoose';
import Brand from '../src/models/Brand';
import FootwearType from '../src/models/FootwearType';
import Product from '../src/models/Product';
import Promotion from '../src/models/Promotion';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fp-zapatillas-dev';

async function runSeed() {
  try {
    console.log('🔄 Conectando a MongoDB en:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión establecida.');

    // Limpiar colecciones anteriores
    console.log('🧹 Limpiando colecciones anteriores...');
    await Brand.deleteMany({});
    await FootwearType.deleteMany({});
    await Product.deleteMany({});
    await Promotion.deleteMany({});

    // 1. Crear Marcas
    console.log('🏷️  Creando Marcas...');
    const brandsData = [
      { name: 'Nike' },
      { name: 'Adidas' },
      { name: 'Puma' },
      { name: 'New Balance' },
      { name: 'Reebok' },
    ];
    const createdBrands = await Brand.insertMany(brandsData);
    const brandMap = new Map(createdBrands.map((b) => [b.name, b._id]));

    // 2. Crear Tipos de Calzado
    console.log('👟 Creando Tipos de Calzado...');
    const typesData = [
      { name: 'Zapatilla Running', description: 'Calzado técnico de alto rendimiento para correr' },
      { name: 'Zapatilla Urbana', description: 'Diseño casual y cómodo para uso diario' },
      { name: 'Zapatilla Deportiva', description: 'Para entrenamiento, gym y multideporte' },
      { name: 'Zapato Elegante', description: 'Calzado formal de vestir' },
      { name: 'Ojota', description: 'Calzado liviano e informal para verano' },
    ];
    const createdTypes = await FootwearType.insertMany(typesData);
    const typeMap = new Map(createdTypes.map((t) => [t.name, t._id]));

    // 3. Crear Promociones (Banners del carrusel)
    console.log('🖼️  Creando Banners Promocionales...');
    const promotionsData = [
      {
        title: 'Lanzamiento Exclusivo - 20% OFF en Efectivo',
        description: 'Aprovechá nuestros descuentos especiales abonando en efectivo o transferencia',
        imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1400&q=80',
        active: true,
        order: 1,
      },
      {
        title: 'Colección Urban 2026',
        description: 'Lo último en tendencias urbanas de Nike, Adidas y New Balance',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80',
        active: true,
        order: 2,
      },
    ];
    await Promotion.insertMany(promotionsData);

    // 4. Crear Productos
    console.log('📦 Creando Productos y Stock por Talle...');
    const productsData = [
      {
        name: 'Nike Air Max 90',
        description: 'La mítica zapatilla Air Max 90 combina amortiguación de aire visible con un diseño icónico y duradero.',
        price: 120000,
        brandId: brandMap.get('Nike'),
        typeId: typeMap.get('Zapatilla Running'),
        gender: 'Hombre',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
            isPrincipal: false,
            position: 2,
          },
        ],
        sizesStock: [
          { size: 38, stock: 5 },
          { size: 39, stock: 8 },
          { size: 40, stock: 15 },
          { size: 41, stock: 10 },
          { size: 42, stock: 8 },
          { size: 43, stock: 4 },
          { size: 44, stock: 0 },
        ],
      },
      {
        name: 'Adidas Ultraboost Light',
        description: 'Sentí la energía a cada paso con la tecnología Ultraboost de amortiguación responsiva extrema.',
        price: 145000,
        brandId: brandMap.get('Adidas'),
        typeId: typeMap.get('Zapatilla Running'),
        gender: 'Hombre',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
        ],
        sizesStock: [
          { size: 39, stock: 4 },
          { size: 40, stock: 10 },
          { size: 41, stock: 12 },
          { size: 42, stock: 6 },
          { size: 43, stock: 2 },
        ],
      },
      {
        name: 'Nike Court Vision Low',
        description: 'Inspirada en el básquet de los 80, esta zapatilla urbana combina cuero sintético duradero y estilo clásico.',
        price: 89900,
        brandId: brandMap.get('Nike'),
        typeId: typeMap.get('Zapatilla Urbana'),
        gender: 'Unisex',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
        ],
        sizesStock: [
          { size: 36, stock: 3 },
          { size: 37, stock: 5 },
          { size: 38, stock: 8 },
          { size: 39, stock: 10 },
          { size: 40, stock: 12 },
          { size: 41, stock: 4 },
          { size: 42, stock: 0 },
        ],
      },
      {
        name: 'Puma Carina 2.0',
        description: 'Estilo ochentero relajado con plantilla SoftFoam+ para una pisada sumamente suave durante todo el día.',
        price: 75000,
        brandId: brandMap.get('Puma'),
        typeId: typeMap.get('Zapatilla Urbana'),
        gender: 'Mujer',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
        ],
        sizesStock: [
          { size: 34, stock: 2 },
          { size: 35, stock: 6 },
          { size: 36, stock: 10 },
          { size: 37, stock: 8 },
          { size: 38, stock: 5 },
          { size: 39, stock: 0 },
        ],
      },
      {
        name: 'New Balance 574 Core',
        description: 'El clásico indiscutido de New Balance. Versatilidad, confort y materiales de primera calidad.',
        price: 115000,
        brandId: brandMap.get('New Balance'),
        typeId: typeMap.get('Zapatilla Urbana'),
        gender: 'Hombre',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
        ],
        sizesStock: [
          { size: 39, stock: 6 },
          { size: 40, stock: 12 },
          { size: 41, stock: 15 },
          { size: 42, stock: 8 },
          { size: 43, stock: 5 },
        ],
      },
      {
        name: 'Adidas Adilette Comfort',
        description: 'Ojota liviana con plantilla contorneada para máximo descanso tras el deporte o en la pileta.',
        price: 35000,
        brandId: brandMap.get('Adidas'),
        typeId: typeMap.get('Ojota'),
        gender: 'Unisex',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
        ],
        sizesStock: [
          { size: 37, stock: 10 },
          { size: 38, stock: 15 },
          { size: 39, stock: 20 },
          { size: 40, stock: 15 },
          { size: 41, stock: 8 },
        ],
      },
      {
        name: 'Reebok Nano X3',
        description: 'Zapatilla de entrenamiento cruzado diseñada para levantamiento, cardio y entrenamientos funcionales.',
        price: 130000,
        brandId: brandMap.get('Reebok'),
        typeId: typeMap.get('Zapatilla Deportiva'),
        gender: 'Hombre',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
        ],
        sizesStock: [
          { size: 40, stock: 8 },
          { size: 41, stock: 10 },
          { size: 42, stock: 5 },
          { size: 43, stock: 3 },
        ],
      },
      {
        name: 'Nike Star Runner 3',
        description: 'Zapatilla infantil liviana con tracción flexible para jugar sin parar todo el día.',
        price: 58000,
        brandId: brandMap.get('Nike'),
        typeId: typeMap.get('Zapatilla Running'),
        gender: 'Niño',
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80',
            isPrincipal: true,
            position: 1,
          },
        ],
        sizesStock: [
          { size: 26, stock: 4 },
          { size: 27, stock: 6 },
          { size: 28, stock: 8 },
          { size: 29, stock: 10 },
          { size: 30, stock: 5 },
          { size: 31, stock: 0 },
        ],
      },
    ];

    await Product.insertMany(productsData);

    console.log('🎉 Seeding completado con éxito:');
    console.log(` - ${createdBrands.length} Marcas creadas.`);
    console.log(` - ${createdTypes.length} Tipos de Calzado creados.`);
    console.log(` - ${promotionsData.length} Promociones creadas.`);
    console.log(` - ${productsData.length} Productos con stock cargados.`);

    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

runSeed();
