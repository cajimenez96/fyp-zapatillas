import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import SalesRecord from '@/models/SalesRecord';
import mongoose from 'mongoose';

const WHOLESALE_THRESHOLD = 5;

/**
 * POST /api/admin/sales/create-direct
 * Creates a direct sale from the admin POS panel.
 * - Saved directly as 'autorizado' with origin 'admin_direct'
 * - Immediately decrements stock (real unified inventory)
 */
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectToDatabase();
    const body = await req.json();
    const { guest, items, paymentMethod, discountNote, discount } = body;

    // 1. Validate guest data
    if (!guest || !guest.name || !guest.lastName || !guest.phone) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'Los datos del cliente son obligatorios.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST', message: 'La venta debe incluir al menos un producto.' },
        { status: 400 }
      );
    }

    // 2. Server-side wholesale threshold evaluation
    const totalPairs = items.reduce((sum: number, item: { qty: number }) => {
      return sum + Math.max(1, Number(item.qty));
    }, 0);
    const isWholesale = totalPairs >= WHOLESALE_THRESHOLD;

    // 3. Build validated items resolving prices from DB
    const validatedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product || !product.active) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          {
            ok: false,
            error: 'PRODUCT_NOT_FOUND',
            message: `Producto con ID "${item.productId}" no disponible.`,
          },
          { status: 400 }
        );
      }

      // Verify stock availability
      const sizeEntry = product.sizesStock.find((s) => s.size === Number(item.size));
      const availableStock = sizeEntry?.stock ?? 0;
      const itemQty = Math.max(1, Number(item.qty));

      if (availableStock < itemQty) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          {
            ok: false,
            error: 'INSUFFICIENT_STOCK',
            message: `Stock insuficiente para "${product.name}" (Talle ${item.size}). Disponible: ${availableStock}, Requerido: ${itemQty}.`,
          },
          { status: 409 }
        );
      }

      // Use custom price if admin explicitly set it, otherwise resolve from catalog
      let unitPrice: number;
      let appliedPriceType: 'retail' | 'wholesale' | 'custom';

      if (item.unitPrice !== undefined && item.unitPrice !== null) {
        unitPrice = Number(item.unitPrice);
        appliedPriceType = 'custom';
      } else if (isWholesale) {
        unitPrice = product.wholesalePrice ?? product.retailPrice ?? product.price ?? 0;
        appliedPriceType = 'wholesale';
      } else {
        unitPrice = product.retailPrice ?? product.price ?? 0;
        appliedPriceType = 'retail';
      }

      const itemSubtotal = unitPrice * itemQty;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        size: Number(item.size),
        qty: itemQty,
        appliedPriceType,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    // 4. Atomically decrement stock for all items
    for (const item of validatedItems) {
      await Product.updateOne(
        { _id: item.productId, 'sizesStock.size': item.size },
        { $inc: { 'sizesStock.$.stock': -item.qty } },
        { session }
      );
    }

    // 5. Generate order number
    const currentYear = new Date().getFullYear();
    const count = await Order.countDocuments().session(session);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PED-${currentYear}-${(count + 1).toString().padStart(4, '0')}${randomSuffix.toString().slice(-2)}`;

    const appliedDiscount = Math.max(0, Number(discount ?? 0));
    const total = Math.max(0, calculatedSubtotal - appliedDiscount);

    // 6. Create order directly as 'autorizado'
    const [newOrder] = await Order.create(
      [
        {
          orderNumber,
          origin: 'admin_direct',
          guest: {
            name: guest.name.trim(),
            lastName: guest.lastName.trim(),
            phone: guest.phone.trim(),
          },
          items: validatedItems,
          subtotal: calculatedSubtotal,
          discount: appliedDiscount,
          total,
          paymentMethod: ['transferencia', 'efectivo', 'tarjeta', 'otro'].includes(paymentMethod)
            ? paymentMethod
            : 'efectivo',
          status: 'autorizado',
          notes: discountNote ? discountNote.trim() : '',
        },
      ],
      { session }
    );

    // 7. Create SalesRecord immediately
    const [salesRecord] = await SalesRecord.create(
      [
        {
          orderId: newOrder._id,
          orderNumber: newOrder.orderNumber,
          confirmationDate: new Date(),
          recordedPaymentMethod: newOrder.paymentMethod,
          appliedDiscountNote: discountNote ?? '',
          finalTotal: total,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      {
        ok: true,
        message: 'Venta directa registrada y stock actualizado.',
        orderId: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        salesRecordId: salesRecord._id.toString(),
        total,
      },
      { status: 201 }
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error al registrar venta directa:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al registrar la venta directa.' },
      { status: 500 }
    );
  }
}
