import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFootwearType {
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFootwearTypeDocument extends IFootwearType, Document {}

const FootwearTypeSchema: Schema<IFootwearTypeDocument> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del tipo de calzado es obligatorio'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const FootwearType: Model<IFootwearTypeDocument> =
  mongoose.models.FootwearType ||
  mongoose.model<IFootwearTypeDocument>('FootwearType', FootwearTypeSchema);

export default FootwearType;
