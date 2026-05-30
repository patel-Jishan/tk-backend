
const mongoose = require("mongoose");

const photographerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  city: String,

  // role: {
  //   type: String,
  //   enum: [
  //     "traditional_photographer",
  //     "traditional_videographer",
  //     "semi_candid_photographer",
  //     "semi_candid_videographer",
  //     "candid_photographer",
  //     "cinematographer",
  //     "drone"
  //   ]
  // },
  role: {
  type: String,
  required: true
},

  perDayRate: {
    type: Number,
    required: true
  },

  avatar: {
    url: {
      type: String,
      default: "https://res.cloudinary.com/dx8zo5ukg/image/upload/v1778921634/Profile_cyjo1x.png",
    },
    public_id: String,
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