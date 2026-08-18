import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBrandDocument extends IBrand, Document {}

const BrandSchema: Schema<IBrandDocument> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la marca es obligatorio'],
      unique: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Brand: Model<IBrandDocument> =
  mongoose.models.Brand || mongoose.model<IBrandDocument>('Brand', BrandSchema);

export default Brand;
