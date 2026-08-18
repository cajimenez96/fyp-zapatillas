import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings {
  bankAlias: string;
  bankHolder: string;
  bankName: string;
  storePhone: string;
  updatedAt?: Date;
}

export interface ISettingsDocument extends ISettings, Document {}

const SettingsSchema: Schema<ISettingsDocument> = new Schema(
  {
    bankAlias: {
      type: String,
      default: 'FP.ZAPATILLAS',
      trim: true,
    },
    bankHolder: {
      type: String,
      default: 'FP Calzados',
      trim: true,
    },
    bankName: {
      type: String,
      default: 'Banco Galicia',
      trim: true,
    },
    storePhone: {
      type: String,
      default: '5493815218630',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings ||
  mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

export default Settings;
