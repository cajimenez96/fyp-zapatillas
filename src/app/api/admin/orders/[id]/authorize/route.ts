import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import SalesRecord from '@/models/SalesRecord';
import mongoose from 'mongoose';

/**
 * POST /api/admin/orders/:id/authorize
 * Authorizes a pending order:
 * 1. Verifies stock availability for each item+size
 * 2. Atomically decrements stock in a MongoDB transaction
 * 3. Transitions order status to 'autorizado'
 * 4. Creates a SalesRecord
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { recordedPaymentMethod, discountNote, finalTotal } = body;

    if (!recordedPaymentMethod) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'El medio de pago registrado es obligatorio.' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Solicitud no encontrada.' },
        { status: 404 }
      );
    }

    if (order.status !== 'pendiente') {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_STATUS',
          message: `Solo se pueden autorizar órdenes en estado "pendiente". Estado actual: "${order.status}".`,
        },
        { status: 409 }
      );
    }

    // 1. Verify stock availability for all items before any write
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          {
            ok: false,
            error: 'PRODUCT_NOT_FOUND',
            message: `Producto "${item.name}" ya no existe en el catálogo.`,
          },
          { status: 409 }
        );
      }

      const sizeEntry = product.sizesStock.find((s) => s.size === item.size);
      const availableStock = sizeEntry?.stock ?? 0;

      if (availableStock < item.qty) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          {
            ok: false,
            error: 'INSUFFICIENT_STOCK',
            message: `Stock insuficiente para "${item.name}" (Talle ${item.size}). Disponible: ${availableStock}, Requerido: ${item.qty}.`,
          },
          { status: 409 }
        );
      }
    }

    // 2. Decrement stock atomically for each item
    for (const item of order.items) {
      await Product.updateOne(
        {
          _id: item.productId,
          'sizesStock.size': item.size,
        },
        {
          $inc: { 'sizesStock.$.stock': -item.qty },
        },
        { session }
      );
    }

    // 3. Update order to 'autorizado'
    const resolvedFinalTotal = finalTotal !== undefined ? Number(finalTotal) : order.total;
    order.status = 'autorizado';
    if (discountNote) order.notes = discountNote.trim();
    await order.save({ session });

    // 4. Create SalesRecord
    const salesRecord = await SalesRecord.create(
      [
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          confirmationDate: new Date(),
          recordedPaymentMethod,
          appliedDiscountNote: discountNote ?? '',
          finalTotal: resolvedFinalTotal,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      ok: true,
      message: 'Venta autorizada exitosamente y stock actualizado.',
      salesRecordId: salesRecord[0]._id.toString(),
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error al autorizar orden:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al autorizar la venta.' },
      { status: 500 }
    );
  }
}
