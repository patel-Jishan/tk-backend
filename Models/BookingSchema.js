const mongoose = require("mongoose");

const dataHandoverSchema = new mongoose.Schema({
  photographerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photographer",
    required: true
  },

  drives: [
    {
      driveType: {
        type: String,
        enum: ["A", "B", "C", "D"],
        required: true
      },

      handedOver: {
        type: Boolean,
        default: true
      },

      handedOverDate: {
        type: Date,
        default: Date.now
      },

      receivedBy: {
        type: String,
        required: true
      },

      copiedToPC: {
        type: Boolean,
        default: false
      },

      note: String
    }
  ]
});

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
        default: 1,
        min: 1
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

  assignments: [
    {
      photographerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photographer",
        required: true
      },

      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
      },

      payAmount: {
        type: Number,
        default: 0,
        min: 0
      }
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
        quantity: {
          type: Number,
          default: 1,
          min: 1
        }
      }
    ],

    assigned: [assignedSchema],
    dataHandover: [dataHandoverSchema],

    subtotal: {
  type: Number,
  default: 0
},

profitPercentage: {
  type: Number,
  default: 0
},

profitAmount: {
  type: Number,
  default: 0
},

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
    discountPercentage: {
  type: Number,
  default: 0
},

discountAmount: {
  type: Number,
  default: 0
},

finalAmount: {
  type: Number,
  default: 0
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
