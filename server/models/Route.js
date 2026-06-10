const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  id:        { type: String, required: true },
  cityName:  { type: String, required: true },
  region:    { type: String, required: true },
  area:      { type: String, required: true },
}, { _id: false });

const RouteSchema = new mongoose.Schema({
  routeId:      { type: String, required: true, unique: true },
  origin:       { type: LocationSchema, required: true },
  destination:  { type: LocationSchema, required: true },
  mode:         { type: String, required: true },
  vehicleType:  { type: String, required: true },
  partner:      { type: String, required: true },
  productTypes: { type: [String], default: [] },
  capacity:     { type: Number, default: 0 },
  available:    { type: Number, default: 0 },
  utilization:  { type: Number, default: 0 },
  stops:        { type: [String], default: [] },
  transitTimeMin: { type: Number, default: 0 },
  distanceKm:   { type: Number, default: 0 },
  frequencyPerDay: { type: Number, default: 0 },
  status:       { type: String, enum: ['active', 'degraded', 'offline'], default: 'active' },
  updatedAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Route', RouteSchema);
