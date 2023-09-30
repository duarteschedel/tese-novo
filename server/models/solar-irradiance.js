const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const solarIrradiance = new Schema({
  date: { type: Date, required: true, default: new Date() },
  period_end: { type: Date, required: true },
  period: { type: String, required: true },
  pv_estimate: { type: Number, required: true },
});

module.exports = mongoose.model("solarIrradiances", solarIrradiance);
