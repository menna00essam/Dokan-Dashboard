const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  exchange_rate: { type: Number, required: true },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Currency', currencySchema);
