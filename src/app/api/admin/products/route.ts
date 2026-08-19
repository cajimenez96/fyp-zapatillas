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

    const brandId = searchParams.get('brandId');
    const typeId = searchParams.get('typeId');
    const gender = searchParams.get('gender');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (brandId) query.brandId = brandId;
    if (typeId) query.typeId = typeId;
    if (gender) query.gender = gender;
    if (active !== null && active !== undefined && active !== '') {
      query.active = active === 'true';
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Ensure models are registered
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    Brand;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    FootwearType;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('brandId', 'name')
      .populate('typeId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format total stock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedProducts = products.map((prod: any) => {
      const sizesStock = prod.sizesStock || [];
      const totalStock = sizesStock.reduce(
        (acc: number, curr: { stock: number }) => acc + curr.stock,
        0
      );
      return {
        ...prod,
        totalStock,
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
    console.error('Error al obtener productos en admin:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { name, description, retailPrice, wholesalePrice, brandId, typeId, gender, active, images, sizesStock } = body;

    // Validations
    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El nombre del producto es obligatorio' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'La descripción es obligatoria' },
        { status: 400 }
      );
    }

    if (retailPrice === undefined || retailPrice === null || Number(retailPrice) < 0) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El precio minorista debe ser un número mayor o igual a 0' },
        { status: 400 }
      );
    }

    if (wholesalePrice === undefined || wholesalePrice === null || Number(wholesalePrice) < 0) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El precio mayorista debe ser un número mayor o igual a 0' },
        { status: 400 }
      );
    }

    if (!brandId || !typeId || !gender) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'Marca, tipo de calzado y género son obligatorios' },
        { status: 400 }
      );
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'Debe incluir al menos una imagen' },
        { status: 400 }
      );
    }

    if (!sizesStock || !Array.isArray(sizesStock) || sizesStock.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'Debe cargar el stock por talle' },
        { status: 400 }
      );
    }

    const newProduct = await Product.create({
      name: name.trim(),
      description: description.trim(),
      retailPrice: Number(retailPrice),
      wholesalePrice: Number(wholesalePrice),
      brandId,
      typeId,
      gender,
      active: active !== undefined ? Boolean(active) : true,
      images,
      sizesStock,
    });

    return NextResponse.json({ ok: true, data: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al crear el producto' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, name, description, retailPrice, wholesalePrice, active, images, sizesStock } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El ID del producto es obligatorio' },
        { status: 400 }
      );
    }

    // Note: brandId, typeId, gender are locked/immutable per business rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFields: Record<string, any> = {};

    if (name !== undefined) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (retailPrice !== undefined) updateFields.retailPrice = Number(retailPrice);
    if (wholesalePrice !== undefined) updateFields.wholesalePrice = Number(wholesalePrice);
    if (active !== undefined) updateFields.active = Boolean(active);
    if (images !== undefined) updateFields.images = images;
    if (sizesStock !== undefined) updateFields.sizesStock = sizesStock;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: updatedProduct });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al actualizar el producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El ID del producto es obligatorio' },
        { status: 400 }
      );
    }

    // Soft delete: deactivate product to maintain sales history
    const updated = await Product.findByIdAndUpdate(id, { active: false }, { new: true });

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Producto desactivado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al desactivar el producto' },
      { status: 500 }
    );
  }
}
