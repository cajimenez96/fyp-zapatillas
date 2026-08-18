import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Promotion from '@/models/Promotion';

export async function GET() {
  try {
    await connectToDatabase();

    const promotions = await Promotion.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      ok: true,
      data: promotions,
    });
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'No se pudieron obtener los banners promocionales',
      },
      { status: 500 }
    );
  }
}
