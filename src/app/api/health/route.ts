import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const dbState = conn.connection.readyState; // 1 = connected
    const dbName = conn.connection.name;

    return NextResponse.json({
      ok: true,
      status: 'online',
      database: {
        connected: dbState === 1,
        name: dbName,
        readyState: dbState,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        message: 'No se pudo establecer conexión con MongoDB',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
