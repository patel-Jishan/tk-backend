const mongoose = require("mongoose");

// 🔥 Transaction Schema
const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },

  transactionId: String,

  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "bank"]
  },

  type: {
    type: String,
    enum: ["advance", "remaining"],
    default: "advance"
  },

  date: {
    type: Date,
    default: Date.now
  }
});

// 🔥 Main Payment Schema
const photographerPaymentSchema = new mongoose.Schema({
  
  photographerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photographer",
    required: true
  },

  month: {
    type: String, // "2026-05"
    required: true
  },

  totalDays: Number,
  perDayRate: Number,

  totalAmount: {
    type: Number,
    required: true
  },

  // ✅ kitna pay hua
  advancePaid: {
    type: Number,
    default: 0
  },

  // ✅ kitna baki hai
  remainingAmount: {
    type: Number,
    default: 0
  },

  // 🔥 NEW (VERY IMPORTANT)
  // 👉 extra jo next month carry hoga
  extraPaid: {
    type: Number,
    default: 0
  },

  carryForward: {
  type: Number,
  default: 0
},

  status: {
    type: String,
    enum: ["pending", "partial", "paid", "overdue"],
    default: "pending"
  },

  transactions: [transactionSchema],

  note: String,

  dueDate: Date

}, { timestamps: true });

module.exports = mongoose.model("PhotographerPayment", photographerPaymentSchema);