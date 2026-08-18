import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Brand from '@/models/Brand';

export async function GET() {
  try {
    await connectToDatabase();
    const brands = await Brand.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ ok: true, data: brands });
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'No se pudieron obtener las marcas' },
      { status: 500 }
    );
  }
}
