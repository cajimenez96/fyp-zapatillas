import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import SalesRecord from '@/models/SalesRecord';
import { Types } from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    console.error('Error al obtener orden:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al consultar solicitud' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/orders/:id
 * Update a pending order's items, quantities, pricing, guest data, or notes
 * WITHOUT touching stock — stock only decrements on authorization.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { guest, items, discount, notes, paymentMethod } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (order.status !== 'pendiente') {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_STATUS',
          message: `Solo se pueden editar órdenes en estado "pendiente". Estado actual: "${order.status}".`,
        },
        { status: 409 }
      );
    }

    // Update guest data if provided
    if (guest) {
      if (guest.name) order.guest.name = guest.name.trim();
      if (guest.lastName) order.guest.lastName = guest.lastName.trim();
      if (guest.phone) order.guest.phone = guest.phone.trim();
    }

    // Update items if provided — recalculate subtotals
    if (items && Array.isArray(items) && items.length > 0) {
      const validatedItems = items.map((item: {
        productId: string;
        name: string;
        size: number;
        qty: number;
        unitPrice: number;
        appliedPriceType?: string;
      }) => ({
        productId: item.productId,
        name: item.name,
        size: Number(item.size),
        qty: Math.max(1, Number(item.qty)),
        appliedPriceType: (item.appliedPriceType ?? 'custom') as 'retail' | 'wholesale' | 'custom',
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.unitPrice) * Math.max(1, Number(item.qty)),
      }));

      // Cast productId strings to ObjectId for Mongoose schema compatibility
      const castItems = validatedItems.map((i) => ({
        ...i,
        productId: new Types.ObjectId(i.productId as string),
      }));
      order.items = castItems as typeof order.items;
    }

    // Recalculate subtotal from items
    const newSubtotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);
    order.subtotal = newSubtotal;

    if (discount !== undefined) {
      order.discount = Math.max(0, Number(discount));
    }

    order.total = Math.max(0, order.subtotal - order.discount);

    if (notes !== undefined) order.notes = notes.trim();
    if (paymentMethod && ['transferencia', 'efectivo', 'tarjeta', 'otro'].includes(paymentMethod)) {
      order.paymentMethod = paymentMethod;
    }

    await order.save();

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    console.error('Error al editar orden pendiente:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al actualizar la solicitud' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/:id
 * Cancel a pending order (does not touch stock).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body;

    if (action !== 'cancel') {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'Acción inválida. Use action: "cancel".' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (order.status === 'cancelado' || order.status === 'cancelada') {
      return NextResponse.json(
        { ok: false, error: 'INVALID_STATUS', message: 'La orden ya está cancelada.' },
        { status: 409 }
      );
    }

    order.status = 'cancelado';
    if (notes) order.notes = notes.trim();
    await order.save();

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    console.error('Error al cancelar orden:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al cancelar la solicitud' },
      { status: 500 }
    );
  }
}

// Silence unused import warning — SalesRecord is used in the authorize route
void SalesRecord;
void Product;
