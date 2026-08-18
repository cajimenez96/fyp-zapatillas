import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import Brand from '@/models/Brand';
import FootwearType from '@/models/FootwearType';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Ensure models are registered
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    Brand;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    FootwearType;

    const products = await Product.find(query)
      .populate('brandId', 'name')
      .populate('typeId', 'name')
      .sort({ name: 1 })
      .lean();

    let totalPairsInStock = 0;
    let outOfStockProductsCount = 0;

    // Process products with detailed stock metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stockItems = products.map((prod: any) => {
      const sizesStock = prod.sizesStock || [];
      const totalStock = sizesStock.reduce(
        (acc: number, curr: { stock: number }) => acc + curr.stock,
        0
      );

      totalPairsInStock += totalStock;
      if (totalStock === 0) outOfStockProductsCount++;

      const lowStockSizes = sizesStock.filter(
        (s: { stock: number }) => s.stock > 0 && s.stock < 3
      );

      return {
        _id: prod._id,
        name: prod.name,
        brandName: typeof prod.brandId === 'object' && prod.brandId ? prod.brandId.name : '-',
        typeName: typeof prod.typeId === 'object' && prod.typeId ? prod.typeId.name : '-',
        gender: prod.gender,
        price: prod.price,
        active: prod.active,
        image: prod.images?.[0]?.url || '',
        totalStock,
        sizesStock,
        hasLowStock: lowStockSizes.length > 0 || totalStock === 0,
      };
    });

    const filteredStockItems = lowStockOnly
      ? stockItems.filter((item) => item.hasLowStock)
      : stockItems;

    return NextResponse.json({
      ok: true,
      data: {
        totalPairsInStock,
        totalProductsCount: products.length,
        outOfStockProductsCount,
        items: filteredStockItems,
      },
    });
  } catch (error) {
    console.error('Error al obtener reporte de stock:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al consultar reporte de stock' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { productId, size, newStock } = await req.json();

    if (!productId || size === undefined || newStock === undefined || newStock < 0) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'productId, talle y stock válido son obligatorios' },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const sizeNum = Number(size);
    const stockNum = Number(newStock);

    const sizeMap = new Map(product.sizesStock.map((s) => [s.size, s.stock]));
    sizeMap.set(sizeNum, stockNum);

    product.sizesStock = Array.from(sizeMap.entries()).map(([sz, st]) => ({
      size: sz,
      stock: st,
    }));

    await product.save();

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    console.error('Error al actualizar stock rápido:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al actualizar stock' },
      { status: 500 }
    );
  }
}
