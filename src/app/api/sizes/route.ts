import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import GenderSize, { DEFAULT_GENDER_SIZES } from '@/models/GenderSize';
import { GenderType } from '@/models/Product';

export const dynamic = 'force-dynamic';

const VALID_GENDERS: GenderType[] = ['Hombre', 'Mujer', 'Niño', 'Unisex'];

export async function GET() {
  try {
    await connectToDatabase();
    const docs = await GenderSize.find({}).lean();
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
    console.error('Error al consultar talles públicos:', error);
    return NextResponse.json(
      { ok: true, data: DEFAULT_GENDER_SIZES },
      { status: 200 }
    );
  }
}
