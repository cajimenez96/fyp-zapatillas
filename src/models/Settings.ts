import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings {
  // Identity & Contact
  storeName: string;
  storePhone: string;
  storeEmail: string;
  businessHours: string;
  whatsappInquiryMessage: string;
  instagramUrl: string;
  facebookUrl: string;

  // Bank Data
  bankAlias: string;
  bankCbu: string;
  bankHolder: string;
  bankCuit: string;
  bankName: string;

  // Inventory & Alerts
  minStockAlert: number;

  // Commercial Rules
  wholesaleMinPairs: number;
  shippingInfo: string;

  updatedAt?: Date;
}

export interface ISettingsDocument extends ISettings, Document {}

const SettingsSchema: Schema<ISettingsDocument> = new Schema(
  {
    // Identity & Contact
    storeName: {
      type: String,
      default: "FP Zapatillas",
      trim: true,
    },
    storePhone: {
      type: String,
      default: "-",
      trim: true,
    },
    storeEmail: {
      type: String,
      default: "contacto@fpzapatillas.com",
      trim: true,
    },
    businessHours: {
      type: String,
      default: "Lun a Sáb: 9:00 a 20:00 hs",
      trim: true,
    },
    whatsappInquiryMessage: {
      type: String,
      default: "Hola! Tengo una consulta sobre un calzado",
      trim: true,
    },
    instagramUrl: {
      type: String,
      default: "",
      trim: true,
    },
    facebookUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Bank Data
    bankAlias: {
      type: String,
      default: "FP.ZAPATILLAS",
      trim: true,
    },
    bankCbu: {
      type: String,
      default: "",
      trim: true,
    },
    bankHolder: {
      type: String,
      default: "FP Calzados",
      trim: true,
    },
    bankCuit: {
      type: String,
      default: "",
      trim: true,
    },
    bankName: {
      type: String,
      default: "Banco Galicia",
      trim: true,
    },

    // Inventory & Alerts (evaluated over TOTAL pairs per product)
    minStockAlert: {
      type: Number,
      default: 3,
      min: 0,
    },

    // Commercial Rules
    wholesaleMinPairs: {
      type: Number,
      default: 5,
      min: 1,
    },
    shippingInfo: {
      type: String,
      default: "Envíos a todo el país en 24hs",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings ||
  mongoose.model<ISettingsDocument>("Settings", SettingsSchema);

export default Settings;
