import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FootwearType from '@/models/FootwearType';

export async function GET() {
  try {
    await connectToDatabase();
    const types = await FootwearType.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ ok: true, data: types });
  } catch (error) {
    console.error('Error al obtener tipos de calzado:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'No se pudieron obtener los tipos de calzado' },
      { status: 500 }
    );
  }
}
