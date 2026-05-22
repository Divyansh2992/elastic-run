const mongoose = require('mongoose');

const CarrierSchema = new mongoose.Schema({
  name:      { type: String, required: true },  // e.g. "BlueDart"
  capacity:  { type: Number, default: 0 },      // total slots
  available: { type: Number, default: 0 },      // available slots
  status:    { type: String, enum: ['active', 'degraded', 'offline'], default: 'active' },
}, { _id: false });

const FleetTypesSchema = new mongoose.Schema({
  bikes:  { type: Number, default: 0 },
  vans:   { type: Number, default: 0 },
  trucks: { type: Number, default: 0 },
}, { _id: false });

const CitySchema = new mongoose.Schema({
  id:               { type: String, required: true, unique: true },
  name:             { type: String, required: true },
  region:           { type: String, required: true },
  lat:              { type: Number, required: true },
  lng:              { type: Number, required: true },

  // Capacity
  capacity:         { type: Number, default: 0 },
  utilization:      { type: Number, default: 0 },  // 0–1

  // Riders & Vehicles
  riders:           { type: Number, default: 0 },
  vehicles:         { type: Number, default: 0 },

  // Fleet breakdown by type
  fleetTypes:       { type: FleetTypesSchema, default: () => ({ bikes: 0, vans: 0, trucks: 0 }) },

  // Carrier partners
  carriers:         { type: [CarrierSchema], default: [] },

  // Orders
  pending:          { type: Number, default: 0 },
  completed:        { type: Number, default: 0 },
  pendingRetries:   { type: Number, default: 0 },  // absolute retry count

  // Hub / Warehouse
  hubCapacity:      { type: Number, default: 0 },
  hubUsed:          { type: Number, default: 0 },
  hubUtil:          { type: Number, default: 0 },   // 0–1

  // Performance
  successRate:      { type: Number, default: 0 },   // 0–1
  delayRate:        { type: Number, default: 0 },   // 0–1
  slaCompliance:    { type: Number, default: 0 },   // 0–1
  retryRate:        { type: Number, default: 0 },   // 0–1
  avgDeliveryTime:  { type: Number, default: 45 },  // minutes (actual)
  slaWindow:        { type: Number, default: 60 },  // minutes (promised)
  deliveriesPerRider: { type: Number, default: 0 },

  // Shortage flag — demand > capacity
  shortage:         { type: Boolean, default: false },

  // Time-series (7-day)
  firstMile:        [{ type: Number }],
  lastMile:         [{ type: Number }],

  trend:            { type: String, enum: ['up', 'down'], default: 'up' },
  updatedAt:        { type: Date, default: Date.now },
});

module.exports = mongoose.model('City', CitySchema);
