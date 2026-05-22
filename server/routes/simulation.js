const express = require('express');
const router  = express.Router();
const City    = require('../models/City');
const { getStatus } = require('../services/dataEngine');

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// POST /api/simulate
// Body: { demandMultiplier, carrierFailurePct, extraRiders }
router.post('/', async (req, res) => {
  try {
    const {
      demandMultiplier  = 1.0,
      carrierFailurePct = 0,
      extraRiders       = 0,
    } = req.body;

    const mult = parseFloat(demandMultiplier);
    const cf   = parseFloat(carrierFailurePct) / 100;
    const er   = parseInt(extraRiders);

    const cities = await City.find({}).lean();

    const simCities = cities.map(c => {
      const simUtil     = clamp(c.utilization * mult * (1 + cf * 0.2), 0, 1);
      const simCap      = Math.floor(c.capacity * (1 - cf * 0.35));
      const simRiders   = c.riders + Math.floor(er / cities.length);
      const simVehicles = Math.floor(c.vehicles * (1 - cf * 0.4));
      const simShortage = (c.pending + c.completed) * mult > simCap;

      // Simulate carrier degradation
      const simCarriers = (c.carriers || []).map((cr, i) => {
        // First carrier takes the biggest hit
        const failFactor = i === 0 ? cf * 0.6 : i === 1 ? cf * 0.35 : cf * 0.15;
        const available  = Math.floor(cr.available * (1 - failFactor));
        const pct        = available / Math.max(1, cr.capacity);
        const status     = pct < 0.15 ? 'offline' : pct < 0.35 ? 'degraded' : 'active';
        return { ...cr, available, status };
      });

      // Fleet breakdown under failure
      const simFleet = {
        bikes:  Math.floor((c.fleetTypes?.bikes  || 0) * (1 - cf * 0.2)),
        vans:   Math.floor((c.fleetTypes?.vans   || 0) * (1 - cf * 0.4)),
        trucks: Math.floor((c.fleetTypes?.trucks || 0) * (1 - cf * 0.5)),
      };

      return {
        ...c,
        utilization: simUtil,
        capacity:    simCap,
        riders:      simRiders,
        vehicles:    simVehicles,
        shortage:    simShortage,
        carriers:    simCarriers,
        fleetTypes:  simFleet,
        status:      getStatus(simUtil),
        statusLabel: simUtil >= 0.85 ? 'Overloaded' : simUtil >= 0.65 ? 'Medium Load' : 'Healthy',
      };
    });

    const n = simCities.length;
    const totalCapacity   = simCities.reduce((s, c) => s + c.capacity, 0);
    const activeRiders    = simCities.reduce((s, c) => s + c.riders, 0);
    const activeVehicles  = simCities.reduce((s, c) => s + c.vehicles, 0);
    const pendingOrders   = Math.floor(simCities.reduce((s, c) => s + c.pending, 0) * mult);
    const completedToday  = Math.floor(simCities.reduce((s, c) => s + c.completed, 0) * (1 - cf));
    const hubUtilization  = simCities.reduce((s, c) => s + c.hubUtil, 0) / n;
    const successRate     = clamp(simCities.reduce((s, c) => s + c.successRate, 0) / n * (1 - cf * 0.3), 0, 1);
    const delayRate       = clamp(simCities.reduce((s, c) => s + c.delayRate, 0) / n * (1 + cf * 0.5), 0, 1);
    const shortageZones   = simCities.filter(c => c.shortage).length;

    const overloadedCities = simCities.filter(c => c.status === 'critical').map(c => c.name);
    const shortageCities   = simCities.filter(c => c.shortage).map(c => c.name);

    // Offline/degraded carriers
    const affectedCarriers = [];
    simCities.forEach(c => {
      (c.carriers || []).forEach(cr => {
        if (cr.status !== 'active') {
          affectedCarriers.push(`${cr.name} (${c.name}): ${cr.status}`);
        }
      });
    });

    let recommendation = 'Operations within manageable range. Continue monitoring.';
    if (overloadedCities.length > 6)      recommendation = 'EMERGENCY: Activate all standby capacity, surge pricing, and emergency carrier contracts immediately.';
    else if (overloadedCities.length > 4)  recommendation = 'Activate surge pricing and emergency carrier contracts immediately.';
    else if (overloadedCities.length > 2)  recommendation = 'Pre-book additional carrier capacity and notify hub managers.';
    else if (shortageZones > 3)            recommendation = 'Shortage detected in multiple zones — redistribute fleet from healthy regions.';
    else if (mult > 1.4)                   recommendation = 'Monitor closely — consider activating standby riders for peak demand.';

    res.json({
      kpis: { totalCapacity, activeRiders, activeVehicles, pendingOrders, completedToday, hubUtilization, successRate, delayRate, shortageZones },
      overloadedCities,
      warningCities:    simCities.filter(c => c.status === 'warning').map(c => c.name),
      shortageCities,
      affectedCarriers: affectedCarriers.slice(0, 8),
      recommendation,
      demandDeltaPct:   parseFloat(((mult - 1) * 100).toFixed(1)),
      capacityLossPct:  parseFloat((cf * 35).toFixed(1)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
