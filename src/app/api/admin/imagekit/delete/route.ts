import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/lib/imagekit';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El ID de archivo de ImageKit es obligatorio' },
        { status: 400 }
      );
    }

    await imagekit.deleteFile(fileId);

    return NextResponse.json({
      ok: true,
      message: 'Imagen eliminada físicamente de ImageKit CDN',
    });
  } catch (error) {
    console.error('Error al eliminar imagen de ImageKit:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al eliminar la imagen de la CDN' },
      { status: 500 }
    );
  }
}
