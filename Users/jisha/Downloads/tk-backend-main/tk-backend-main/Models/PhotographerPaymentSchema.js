const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: Number,
  transactionId: String,
  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "bank"]
  },
  type: {
    type: String,
    enum: ["advance", "remaining"]
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const photographerPaymentSchema = new mongoose.Schema({
  photographerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photographer"
  },

  month: String, // "2026-05"

  totalDays: Number,
  perDayRate: Number,

  totalAmount: Number,

  advancePaid: {
    type: Number,
    default: 0
  },

  remainingAmount: Number,

  status: {
    type: String,
    enum: ["pending", "partial", "paid", "overdue"], // ✅ added overdue
    default: "pending"
  },

  transactions: [transactionSchema], // ✅ NEW

  note: String,

  dueDate: Date // optional but useful

}, { timestamps: true });

module.exports = mongoose.model("PhotographerPayment", photographerPaymentSchema);