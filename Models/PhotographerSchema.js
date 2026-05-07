
const mongoose = require("mongoose");

const photographerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    city: String,

    role: {
      type: String,
      enum: [
        "traditional_photographer",
        "traditional_videographer",
        "semi_candid_photographer",
        "semi_candid_videographer",
        "candid_photographer",
        "cinematographer",
        "drone"
      ]
    },

    bookedDates: [String], // ["2026-05-10"]

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Photographer", photographerSchema);