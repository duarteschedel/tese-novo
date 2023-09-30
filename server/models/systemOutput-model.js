const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const systemOutput = new Schema({
  p_dis: { type: Number, required: true },
  p_ch: { type: Number, required: true },
  p_pv: { type: Number, required: true },
  p_el: { type: Number, required: true },
  p_r_ch: { type: Number, required: true },
  p_i_dis: { type: Number, required: true },
  p_r_el: { type: Number, required: true },
  p_r_dis: { type: Number, required: true },
  p_i_ch: { type: Number, required: true },
  p_i_el: { type: Number, required: true },
});

module.exports = mongoose.model("systemOutputs", systemOutput);
