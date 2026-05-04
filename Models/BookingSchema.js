
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

const assignedSchema = new mongoose.Schema({
  day: Number,
  photographerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photographer"
  }
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

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);