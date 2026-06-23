const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  paymeId: { type: String, unique: true, sparse: true },
  paymeTime: { type: String },
  orderId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['pro', 'biznes'], required: true },
  amount: { type: Number, required: true },
  state: { type: Number, default: 0 },
  reason: { type: Number, default: null },
  cancelTime: { type: Date, default: null },
  performTime: { type: Date, default: null },
  createTime: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
