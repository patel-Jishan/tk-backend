const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  profitPercentage: {
    type: Number,
    default: 25
  }
});

module.exports = mongoose.model("Setting", settingSchema);
