import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import Brand from '@/models/Brand';
import FootwearType from '@/models/FootwearType';

// Force dynamic server route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const typeId = searchParams.get('typeId');
    const size = searchParams.get('size');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');
    const random = searchParams.get('random') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build filter query for active products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { active: true };

    if (brandId) {
      const brands = brandId.split(',').filter(Boolean);
      if (brands.length > 0) {
        query.brandId = { $in: brands };
      }
    }

    if (typeId) {
      const types = typeId.split(',').filter(Boolean);
      if (types.length > 0) {
        query.typeId = { $in: types };
      }
    }

    if (gender) {
      query.gender = gender;
    }

    if (size) {
      const sizeNumber = parseInt(size, 10);
      if (!isNaN(sizeNumber)) {
        query.sizesStock = {
          $elemMatch: { size: sizeNumber, stock: { $gt: 0 } },
        };
      }
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Ensure models are registered for populate
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    Brand;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    FootwearType;

    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let products: any[];
    let total = 0;

    if (random) {
      // Random sample mode for landing page
      const aggregatePipeline = [
        { $match: query },
        { $sample: { size: limit } },
      ];
      const rawProducts = await Product.aggregate(aggregatePipeline);
      products = await Product.populate(rawProducts, [
        { path: 'brandId', select: 'name' },
        { path: 'typeId', select: 'name' },
      ]);
      total = await Product.countDocuments(query);
    } else {
      // Standard paginated query sorted by newest
      total = await Product.countDocuments(query);
      products = await Product.find(query)
        .populate('brandId', 'name')
        .populate('typeId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    // Map products to include totalStock and isOutOfStock flags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedProducts = products.map((prod: any) => {
      const sizesStock = (prod.sizesStock as { size: number; stock: number }[]) || [];
      const totalStock = sizesStock.reduce((acc, curr) => acc + curr.stock, 0);

      return {
        ...prod,
        totalStock,
        isOutOfStock: totalStock === 0,
      };
    });

    return NextResponse.json({
      ok: true,
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al consultar catálogo de productos:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al consultar catálogo de productos',
      },
      { status: 500 }
    );
  }
}
