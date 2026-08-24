import mongoose, { Schema, Document, Model } from "mongoose";
import { GenderType } from "./Product";
import { DEFAULT_GENDER_SIZES } from "@/constants/sizes";

export { DEFAULT_GENDER_SIZES };

export interface IGenderSize {
  gender: GenderType;
  sizes: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGenderSizeDocument extends IGenderSize, Document {}

const GenderSizeSchema: Schema<IGenderSizeDocument> = new Schema(
  {
    gender: {
      type: String,
      required: true,
      unique: true,
      enum: ["Hombre", "Mujer", "Niño", "Unisex"],
    },
    sizes: {
      type: [Number],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const GenderSize: Model<IGenderSizeDocument> =
  mongoose.models.GenderSize ||
  mongoose.model<IGenderSizeDocument>("GenderSize", GenderSizeSchema);

export default GenderSize;
