// service.model.js
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: String,

  type: {
    type: String,
    enum: ["shoot", "addon"]
  },

  priceType: {
    type: String,
    enum: ["per_day", "fixed", "per_unit"]
  },

//   role: {
//   type: String,
//   enum: [
//     "traditional_photographer",
//     "traditional_videographer",
//     "candid_photographer",
//     "cinematographer",
//     "drone"
//   ]
// },

role: {
  type: String,
  required: true
},

  price: Number
});

module.exports = mongoose.model("Service", serviceSchema);