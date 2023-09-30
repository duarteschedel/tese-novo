const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const objectiveFunctionVariable = new Schema({
  p_da_p: { type: Number, required: true },
  P_da: { type: Number, required: true },
  h_el: { type: Number, required: true },
  P_da_g: { type: Number, required: true },
  r_u: { type: Number, required: true },
  P_u_bc: { type: Number, required: true },
  r_d: { type: Number, required: true },
  P_d_bc: { type: Number, required: true },
  A_u: { type: Number, required: true },
  A_d: { type: Number, required: true },
  P_d_be: { type: Number, required: true },
  p_w: { type: Number, required: true },
  P_w_p: { type: Number, required: true },
  p_wm: { type: Number, required: true },
  P_wm: { type: Number, required: true },
  p_inm: { type: Number, required: true },
  P_inm: { type: Number, required: true },
});

module.exports = mongoose.model(
  "objectiveFunctionVariables",
  objectiveFunctionVariable
);
