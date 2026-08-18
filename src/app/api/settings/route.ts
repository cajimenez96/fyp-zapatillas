import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne({}).lean();

    if (!settings) {
      settings = await Settings.create({
        bankAlias: 'FP.ZAPATILLAS',
        bankHolder: 'FP Calzados',
        bankName: 'Banco Galicia',
        storePhone: '5493815218630',
      });
    }

    return NextResponse.json({ ok: true, data: settings });
  } catch (error) {
    console.error('Error al obtener ajustes:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al consultar ajustes de tienda' },
      { status: 500 }
    );
  }
}
