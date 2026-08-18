import { NextRequest, NextResponse } from 'next/server';
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
    console.error('Error al obtener ajustes en admin:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al consultar ajustes' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { bankAlias, bankHolder, bankName, storePhone } = await req.json();

    if (!bankAlias || !bankHolder || !bankName || !storePhone) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'Todos los datos de transferencia y contacto son obligatorios' },
        { status: 400 }
      );
    }

    let settings = await Settings.findOne({});

    if (!settings) {
      settings = new Settings({});
    }

    settings.bankAlias = bankAlias.trim();
    settings.bankHolder = bankHolder.trim();
    settings.bankName = bankName.trim();
    settings.storePhone = storePhone.trim();

    await settings.save();

    return NextResponse.json({ ok: true, data: settings });
  } catch (error) {
    console.error('Error al actualizar ajustes en admin:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al guardar ajustes' },
      { status: 500 }
    );
  }
}
