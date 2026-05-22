const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type:      { type: String, enum: ['critical', 'warning', 'info'], default: 'info' },
  icon:      { type: String, default: '🟢' },
  msg:       { type: String, required: true },
  city:      { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Auto-expire alerts older than 24 hours
AlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Alert', AlertSchema);
