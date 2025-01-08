import mongoose from "mongoose";

export const TransactionSchema = new mongoose.Schema({
  userid: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  reference: { type: String },
  description: { type: String },
});


export default mongoose.model.Transactions || mongoose.model('Transaction', TransactionSchema);