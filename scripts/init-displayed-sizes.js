const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const ProductSchema = new mongoose.Schema({
  sizesStock: [{ size: Number, stock: Number }],
  displayedSizes: [Number],
});

const Product = mongoose.model('Product', ProductSchema);

async function initializeDisplayedSizes() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('📊 Buscando productos sin displayedSizes...');
    const products = await Product.find({
      $or: [
        { displayedSizes: { $exists: false } },
        { displayedSizes: [] }
      ]
    });

    console.log(`📦 Encontrados ${products.length} productos para actualizar`);

    let updated = 0;
    for (const product of products) {
      const sizesWithStock = product.sizesStock
        .filter(s => s.stock > 0)
        .map(s => s.size)
        .sort((a, b) => a - b);

      await Product.findByIdAndUpdate(product._id, {
        displayedSizes: sizesWithStock
      });

      updated++;
      if (updated % 10 === 0) {
        console.log(`✔️ Actualizados ${updated}/${products.length}`);
      }
    }

    console.log(`\n✅ Limpieza completada: ${updated} productos actualizados`);
    console.log('💾 displayedSizes inicializados con talles que tienen stock > 0');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

initializeDisplayedSizes();
