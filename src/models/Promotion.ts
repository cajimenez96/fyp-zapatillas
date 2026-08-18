import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromotion {
  title: string;
  description?: string;
  imageUrl: string;
  active: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPromotionDocument extends IPromotion, Document {}

const PromotionSchema: Schema<IPromotionDocument> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'El título de la promoción es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'La URL del banner promocional es obligatoria'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PromotionSchema.index({ active: 1, order: 1 });

const Promotion: Model<IPromotionDocument> =
  mongoose.models.Promotion ||
  mongoose.model<IPromotionDocument>('Promotion', PromotionSchema);

export default Promotion;
