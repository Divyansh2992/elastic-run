const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema({
  date:       { type: String, required: true },  // "2025-05-23"
  dayOffset:  { type: Number, required: true },  // 0-13
  demand:     { type: Number, required: true },
  capacity:   { type: Number, required: true },
  eventName:  { type: String, default: null },
  multiplier: { type: Number, default: 1.0 },
  isWeekend:  { type: Boolean, default: false },
  generatedAt:{ type: Date, default: Date.now },
});

module.exports = mongoose.model('Forecast', ForecastSchema);
