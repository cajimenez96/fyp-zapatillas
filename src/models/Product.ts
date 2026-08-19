import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type GenderType = 'Hombre' | 'Mujer' | 'Niño' | 'Unisex';

export interface IProductImage {
  url: string;
  fileId?: string;
  isPrincipal: boolean;
  position: number;
}

export interface ISizeStock {
  size: number;
  stock: number;
}

export interface IProduct {
  name: string;
  description: string;
  /** @deprecated Use retailPrice instead */
  price?: number;
  retailPrice: number;
  wholesalePrice: number;
  brandId: Types.ObjectId;
  typeId: Types.ObjectId;
  gender: GenderType;
  active: boolean;
  images: IProductImage[];
  sizesStock: ISizeStock[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductDocument extends IProduct, Document {}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    fileId: { type: String },
    isPrincipal: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
  },
  { _id: false }
);

const SizeStockSchema = new Schema<ISizeStock>(
  {
    size: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const ProductSchema: Schema<IProductDocument> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción del producto es obligatoria'],
      trim: true,
    },
    // Legacy field — kept for backward compatibility with existing documents
    price: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
    },
    retailPrice: {
      type: Number,
      required: [true, 'El precio minorista es obligatorio'],
      min: [0, 'El precio minorista no puede ser negativo'],
    },
    wholesalePrice: {
      type: Number,
      required: [true, 'El precio mayorista es obligatorio'],
      min: [0, 'El precio mayorista no puede ser negativo'],
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'La marca es obligatoria'],
      immutable: true,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: 'FootwearType',
      required: [true, 'El tipo de calzado es obligatorio'],
      immutable: true,
    },
    gender: {
      type: String,
      enum: {
        values: ['Hombre', 'Mujer', 'Niño', 'Unisex'],
        message: '{VALUE} no es un género válido',
      },
      required: [true, 'El género es obligatorio'],
      immutable: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    images: {
      type: [ProductImageSchema],
      default: [],
    },
    sizesStock: {
      type: [SizeStockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for fast catalog queries and filtering
ProductSchema.index({ active: 1, brandId: 1, typeId: 1, gender: 1 });
ProductSchema.index({ 'sizesStock.size': 1 });

const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

export default Product;
