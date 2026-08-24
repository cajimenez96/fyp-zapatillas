import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import GenderSize, { DEFAULT_GENDER_SIZES } from '@/models/GenderSize';
import { GenderType } from '@/models/Product';

export const dynamic = 'force-dynamic';

const VALID_GENDERS: GenderType[] = ['Hombre', 'Mujer', 'Niño', 'Unisex'];

async function ensureDefaultSizes() {
  const existing = await GenderSize.find({}).lean();
  const existingMap = new Map(existing.map((doc) => [doc.gender, doc.sizes]));

  for (const gender of VALID_GENDERS) {
    if (!existingMap.has(gender)) {
      await GenderSize.create({
        gender,
        sizes: DEFAULT_GENDER_SIZES[gender] || [],
      });
    }
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    await ensureDefaultSizes();

    const docs = await GenderSize.find({}).sort({ gender: 1 }).lean();
    const sizesByGender: Record<string, number[]> = {};

    for (const gender of VALID_GENDERS) {
      const found = docs.find((d) => d.gender === gender);
      sizesByGender[gender] = found ? found.sizes : (DEFAULT_GENDER_SIZES[gender] || []);
    }

    return NextResponse.json({
      ok: true,
      data: sizesByGender,
    });
  } catch (error) {
    console.error('Error al obtener talles por género:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al consultar escalas de talles' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Check for single gender update or bulk update
    if (body.gender && Array.isArray(body.sizes)) {
      const gender = body.gender as GenderType;
      if (!VALID_GENDERS.includes(gender)) {
        return NextResponse.json(
          { ok: false, error: 'BAD_REQUEST', message: 'Género no válido' },
          { status: 400 }
        );
      }

      // Clean & sort sizes
      const parsed: number[] = body.sizes
        .map((s: unknown) => Number(s))
        .filter((s: number) => !isNaN(s) && s > 0 && s < 100);

      const cleanSizes: number[] = Array.from(new Set(parsed)).sort((a, b) => a - b);

      if (cleanSizes.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'BAD_REQUEST', message: 'Debe incluir al menos un talle válido' },
          { status: 400 }
        );
      }

      const updated = await GenderSize.findOneAndUpdate(
        { gender },
        { sizes: cleanSizes },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );

      return NextResponse.json({
        ok: true,
        data: updated,
        message: `Talles para ${gender} actualizados correctamente`,
      });
    }

    // Reset to defaults
    if (body.reset && body.gender) {
      const gender = body.gender as GenderType;
      if (!VALID_GENDERS.includes(gender)) {
        return NextResponse.json(
          { ok: false, error: 'BAD_REQUEST', message: 'Género no válido' },
          { status: 400 }
        );
      }

      const defaultScale = DEFAULT_GENDER_SIZES[gender] || [];
      const updated = await GenderSize.findOneAndUpdate(
        { gender },
        { sizes: defaultScale },
        { returnDocument: 'after', upsert: true }
      );

      return NextResponse.json({
        ok: true,
        data: updated,
        message: `Talles para ${gender} restablecidos a valores por defecto`,
      });
    }

    return NextResponse.json(
      { ok: false, error: 'BAD_REQUEST', message: 'Formato de datos no válido' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error al actualizar talles:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al actualizar escalas de talles' },
      { status: 500 }
    );
  }
}
