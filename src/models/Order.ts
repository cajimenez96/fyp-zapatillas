import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type OrderStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
export type PaymentMethodType = 'transferencia' | 'efectivo';

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  size: number;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface ICustomerGuest {
  name: string;
  lastName: string;
  phone: string;
}

export interface IOrder {
  orderNumber: string;
  guest: ICustomerGuest;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethodType;
  status: OrderStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderDocument extends IOrder, Document {}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto es obligatorio'],
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto en el ítem es obligatorio'],
    },
    size: {
      type: Number,
      required: [true, 'El talle es obligatorio'],
    },
    qty: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio'],
      min: [0, 'El precio unitario no puede ser negativo'],
    },
    subtotal: {
      type: Number,
      required: [true, 'El subtotal del ítem es obligatorio'],
      min: [0, 'El subtotal no puede ser negativo'],
    },
  },
  { _id: false }
);

const CustomerGuestSchema = new Schema<ICustomerGuest>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'El apellido del cliente es obligatorio'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'El teléfono del cliente es obligatorio'],
      trim: true,
    },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrderDocument> = new Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'El número de orden es obligatorio'],
      unique: true,
      index: true,
      trim: true,
    },
    guest: {
      type: CustomerGuestSchema,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        'La orden debe contener al menos un ítem',
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['transferencia', 'efectivo'],
      default: 'transferencia',
    },
    status: {
      type: String,
      enum: ['pendiente', 'confirmada', 'completada', 'cancelada'],
      default: 'pendiente',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ status: 1, createdAt: -1 });

const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;
