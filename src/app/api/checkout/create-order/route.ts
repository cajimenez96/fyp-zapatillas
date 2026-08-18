import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { Types } from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { guest, paymentMethod, notes, items } = body;

    // 1. Basic Payload Validation
    if (!guest || !guest.name || !guest.lastName || !guest.phone) {
      return NextResponse.json(
        {
          ok: false,
          error: 'BAD_REQUEST',
          message: 'Los datos del cliente (nombre, apellido y teléfono) son obligatorios.',
        },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'BAD_REQUEST',
          message: 'El pedido debe incluir al menos un producto.',
        },
        { status: 400 }
      );
    }

    // 2. Fetch real products from DB to prevent client-side price tampering
    const productIds = items.map((item: { productId: string }) => item.productId);
    const dbProducts = await Product.find({
      _id: { $in: productIds.map((id) => new Types.ObjectId(id)) },
      active: true,
    }).lean();

    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        return NextResponse.json(
          {
            ok: false,
            error: 'PRODUCT_NOT_FOUND',
            message: `El producto con ID ${item.productId} ya no está disponible.`,
          },
          { status: 400 }
        );
      }

      const itemQty = Math.max(1, parseInt(item.qty, 10) || 1);
      const itemPrice = dbProd.price;
      const itemSubtotal = itemPrice * itemQty;

      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        productId: dbProd._id,
        name: dbProd.name,
        size: parseInt(item.size, 10),
        qty: itemQty,
        unitPrice: itemPrice,
        subtotal: itemSubtotal,
      });
    }

    // 3. Generate Sequential Order Number (PED-YYYY-XXXXX)
    const currentYear = new Date().getFullYear();
    const countToday = await Order.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PED-${currentYear}-${(countToday + 1).toString().padStart(4, '0')}${randomSuffix.toString().slice(-2)}`;

    const total = calculatedSubtotal;

    // 4. Create and Save Pending Order
    const newOrder = await Order.create({
      orderNumber,
      guest: {
        name: guest.name.trim(),
        lastName: guest.lastName.trim(),
        phone: guest.phone.trim(),
      },
      items: validatedItems,
      subtotal: calculatedSubtotal,
      discount: 0,
      total,
      paymentMethod: paymentMethod === 'efectivo' ? 'efectivo' : 'transferencia',
      status: 'pendiente',
      notes: notes ? notes.trim() : '',
    });

    return NextResponse.json(
      {
        ok: true,
        orderId: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        total: newOrder.total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al registrar orden de compra:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'No se pudo registrar la solicitud de venta',
      },
      { status: 500 }
    );
  }
}
