import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FootwearType from '@/models/FootwearType';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectToDatabase();
    const types = await FootwearType.find({}).sort({ name: 1 }).lean();

    // Compute associated product count for each footwear type
    const typesWithCounts = await Promise.all(
      types.map(async (type) => {
        const productCount = await Product.countDocuments({ typeId: type._id });
        return {
          ...type,
          productCount,
        };
      })
    );

    return NextResponse.json({ ok: true, data: typesWithCounts });
  } catch (error) {
    console.error('Error al consultar tipos de calzado en admin:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al consultar tipos de calzado' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El nombre del tipo de calzado es obligatorio' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const existing = await FootwearType.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'DUPLICATE', message: 'Ya existe un tipo de calzado registrado con este nombre' },
        { status: 400 }
      );
    }

    const newType = await FootwearType.create({
      name: trimmedName,
      description: description ? description.trim() : '',
    });

    return NextResponse.json({ ok: true, data: newType }, { status: 201 });
  } catch (error) {
    console.error('Error al crear tipo de calzado:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al crear tipo de calzado' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { id, name, description } = await req.json();

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'ID y nombre son obligatorios' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const updatedType = await FootwearType.findByIdAndUpdate(
      id,
      {
        name: trimmedName,
        description: description ? description.trim() : '',
      },
      { new: true, runValidators: true }
    );

    if (!updatedType) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Tipo de calzado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: updatedType });
  } catch (error) {
    console.error('Error al editar tipo de calzado:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al actualizar tipo de calzado' },
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
        { ok: false, error: 'BAD_REQUEST', message: 'El ID del tipo de calzado es obligatorio' },
        { status: 400 }
      );
    }

    // Check if products exist for this type
    const linkedProducts = await Product.countDocuments({ typeId: id });
    if (linkedProducts > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'LINKED_PRODUCTS_EXIST',
          message: `No se puede eliminar el tipo de calzado porque tiene ${linkedProducts} productos asociados.`,
        },
        { status: 400 }
      );
    }

    const deleted = await FootwearType.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Tipo de calzado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Tipo de calzado eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar tipo de calzado:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al eliminar tipo de calzado' },
      { status: 500 }
    );
  }
}
