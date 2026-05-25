const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  day: Number,
  date: String,
  location: String,

  services: [
    {
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service"
      },
      quantity: {
        type: Number,
        default: 1
      }
    }
  ]
});

// const assignedSchema = new mongoose.Schema({
//   day: Number,
//   photographerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Photographer"
//   }
// });

const assignedSchema = new mongoose.Schema({
  day: Number,
  photographerIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer"
    }
  ]
});

const bookingSchema = new mongoose.Schema(
  {
    bookingId: String,

    customer: {
      name: String,
      email: String,
      phone: String,
      note: String
    },

    events: [eventSchema],

    addons: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service"
        },
        quantity: Number
      }
    ],

    assigned: [assignedSchema],

    estimate: Number,

    type: {
      type: String,
      enum: ["enquiry", "booking"],
      default: "enquiry"
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending"
    },

    workStatus: {
      type: String,
      enum: [
        "pending",
        "editing",
        "edited",
        "delivery_pending",
        "delivered"
      ],
      default: "pending"
    },


    payment: {
      totalAmount: Number,     // estimate copy
      paidAmount: {
        type: Number,
        default: 0
      },
      remainingAmount: Number,

      status: {
        type: String,
        enum: ["pending", "partial", "completed"],
        default: "pending"
      },

      history: [
        {
          amount: Number,
          transactionId: String,
          paymentMethod: {
            type: String,
            enum: ["cash", "upi", "bank"]
          },
          date: {
            type: Date,
            default: Date.now
          },
          note: String
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);