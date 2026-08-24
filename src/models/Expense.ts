import mongoose, { Schema, Document, Model } from "mongoose";

export type ExpenseCategory =
  | "mercaderia"
  | "logistica"
  | "servicios"
  | "marketing"
  | "alquiler"
  | "sueldos"
  | "otros";

export interface IExpense {
  concept: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: "efectivo" | "transferencia";
  date: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExpenseDocument extends IExpense, Document {}

const ExpenseSchema: Schema<IExpenseDocument> = new Schema(
  {
    concept: {
      type: String,
      required: [true, "El concepto del gasto es obligatorio"],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "mercaderia",
        "logistica",
        "servicios",
        "marketing",
        "alquiler",
        "sueldos",
        "otros",
      ],
      default: "otros",
    },
    amount: {
      type: Number,
      required: [true, "El monto es obligatorio"],
      min: [0.01, "El monto debe ser mayor a 0"],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["efectivo", "transferencia"],
      default: "efectivo",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ date: -1 });

const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense ||
  mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);

export default Expense;
