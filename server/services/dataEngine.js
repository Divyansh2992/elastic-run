// ===================================================
// Data Engine — live tick logic
// Drifts all city metrics periodically and generates alerts
// ===================================================

const City  = require('../models/City');
const Alert = require('../models/Alert');

// ── Utilities ─────────────────────────────────────
function rnd(min, max) { return min + Math.random() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function drift(val, pct, min, max) {
  const delta = val * pct * (Math.random() > 0.5 ? 1 : -1) * Math.random();
  return clamp(parseFloat((val + delta).toFixed(4)), min, max);
}

// ── Status helper ─────────────────────────────────
function getStatus(utilization) {
  if (utilization >= 0.85) return 'critical';
  if (utilization >= 0.65) return 'warning';
  return 'ok';
}

// ── Carrier status helper ─────────────────────────
function carrierStatus(available, capacity) {
  const pct = available / Math.max(1, capacity);
  if (pct < 0.15) return 'offline';
  if (pct < 0.35) return 'degraded';
  return 'active';
}

// ── Alert templates ───────────────────────────────
const TEMPLATES = [
  (c) => ({ type:'critical', icon:'🔴', msg:`Capacity CRITICAL in ${c.name} — ${(c.utilization*100).toFixed(0)}% utilization`, city: c.name }),
  (c) => ({ type:'warning',  icon:'🟡', msg:`${c.name} hub nearing full capacity — ${(c.hubUtil*100).toFixed(0)}% used`,         city: c.name }),
  (c) => ({ type:'warning',  icon:'🟡', msg:`Rider shortage detected in ${c.name}: ${c.riders} active, demand rising`,           city: c.name }),
  (c) => ({ type:'info',     icon:'🟢', msg:`${c.name} zone cleared — utilization dropped to ${(c.utilization*100).toFixed(0)}%`, city: c.name }),
  (c) => ({ type:'critical', icon:'🔴', msg:`SLA breach risk in ${c.name} — avg delivery ${c.avgDeliveryTime?.toFixed(0)} min vs ${c.slaWindow} min promised`, city: c.name }),
  (c) => ({ type:'warning',  icon:'🟡', msg:`High retry rate in ${c.name}: ${(c.retryRate*100).toFixed(1)}% of deliveries`,      city: c.name }),
  (c) => ({ type:'critical', icon:'🔴', msg:`Demand EXCEEDS capacity in ${c.name} — shortage of ${((c.utilization - 1)*c.capacity).toFixed(0)} slots`, city: c.name }),
  (c) => {
    const degraded = (c.carriers || []).find(cr => cr.status !== 'active');
    return degraded
      ? { type:'warning', icon:'🟡', msg:`Carrier ${degraded.name} reporting degraded capacity in ${c.name} — rerouting orders`, city: c.name }
      : { type:'info',    icon:'🟢', msg:`${c.name} fleet rebalancing complete — vehicles redistributed across zones`, city: c.name };
  },
  ()  => ({ type:'info',     icon:'🟢', msg:`Fleet rebalancing complete — 42 vehicles redistributed to North zone`,              city: null }),
  ()  => ({ type:'warning',  icon:'🟡', msg:`Weather alert: heavy rain expected in Mumbai, Pune — delivery delays likely`,       city: null }),
  ()  => ({ type:'critical', icon:'🔴', msg:`Carrier BlueDart reporting capacity constraint — rerouting orders`,                 city: null }),
  ()  => ({ type:'info',     icon:'🟢', msg:`Festival demand model updated — 14-day forecast recalculated`,                      city: null }),
  ()  => ({ type:'warning',  icon:'🟡', msg:`Delhivery fleet offline in North India — activating backup carriers`,               city: null }),
  ()  => ({ type:'critical', icon:'🔴', msg:`Xpressbees SLA breach — avg delivery time exceeding promised window by 25 min`,    city: null }),
];

// ── Compute aggregate KPIs from cities array ──────
function computeKPIs(cities) {
  if (!cities.length) return {};
  const n = cities.length;
  const shortageZones  = cities.filter(c => c.shortage).length;
  const overloadedZones = cities.filter(c => c.utilization >= 0.85).length;
  const warningZones   = cities.filter(c => c.utilization >= 0.65 && c.utilization < 0.85).length;
  const healthyZones   = cities.filter(c => c.utilization < 0.65).length;
  const totalPendingRetries = cities.reduce((s, c) => s + (c.pendingRetries || 0), 0);

  return {
    totalCapacity:      cities.reduce((s, c) => s + c.capacity, 0),
    activeRiders:       cities.reduce((s, c) => s + c.riders, 0),
    activeVehicles:     cities.reduce((s, c) => s + c.vehicles, 0),
    pendingOrders:      cities.reduce((s, c) => s + c.pending, 0),
    completedToday:     cities.reduce((s, c) => s + c.completed, 0),
    hubUtilization:     parseFloat((cities.reduce((s, c) => s + c.hubUtil, 0) / n).toFixed(4)),
    successRate:        parseFloat((cities.reduce((s, c) => s + c.successRate, 0) / n).toFixed(4)),
    delayRate:          parseFloat((cities.reduce((s, c) => s + c.delayRate, 0) / n).toFixed(4)),
    slaCompliance:      parseFloat((cities.reduce((s, c) => s + c.slaCompliance, 0) / n).toFixed(4)),
    overloadedZones,
    warningZones,
    healthyZones,
    shortageZones,
    totalPendingRetries,
    totalBikes:         cities.reduce((s, c) => s + (c.fleetTypes?.bikes || 0), 0),
    totalVans:          cities.reduce((s, c) => s + (c.fleetTypes?.vans  || 0), 0),
    totalTrucks:        cities.reduce((s, c) => s + (c.fleetTypes?.trucks|| 0), 0),
  };
}

// ── Main tick ─────────────────────────────────────
async function tick(io) {
  try {
    const cities = await City.find({});
    const bulkOps = [];

    for (const city of cities) {
      const utilization     = drift(city.utilization,      0.04, 0.10, 0.99);
      const riders          = Math.floor(drift(city.riders,       0.02, 50, 2000));
      const vehicles        = Math.floor(drift(city.vehicles,     0.02, 20, 600));
      const pending         = Math.floor(drift(city.pending,      0.05, 10, 2000));
      const completed       = Math.floor(drift(city.completed,    0.03, 100, 5000));
      const hubUtil         = drift(city.hubUtil,           0.03, 0.10, 0.99);
      const successRate     = drift(city.successRate,       0.01, 0.70, 0.99);
      const delayRate       = drift(city.delayRate,         0.02, 0.01, 0.35);
      const slaCompliance   = drift(city.slaCompliance,     0.01, 0.65, 0.99);
      const retryRate       = drift(city.retryRate,         0.02, 0.01, 0.25);
      const avgDeliveryTime = drift(city.avgDeliveryTime,   0.02, 20, 120);
      const pendingRetries  = Math.floor(completed * retryRate);
      const shortage        = (pending + completed) > city.capacity;

      // Drift fleet types
      const bikes  = Math.floor(drift(city.fleetTypes?.bikes  || 100, 0.03, 20, 800));
      const vans   = Math.floor(drift(city.fleetTypes?.vans   || 40,  0.03, 10, 300));
      const trucks = Math.floor(drift(city.fleetTypes?.trucks || 20,  0.03, 5,  150));

      // Drift carriers
      const updatedCarriers = (city.carriers || []).map(cr => {
        const available = Math.floor(drift(cr.available, 0.05, 0, cr.capacity));
        return {
          name:      cr.name,
          capacity:  cr.capacity,
          available,
          status:    carrierStatus(available, cr.capacity),
        };
      });

      const updated = {
        utilization, riders, vehicles, pending, completed, hubUtil,
        successRate, delayRate, slaCompliance, retryRate, avgDeliveryTime,
        pendingRetries, shortage,
        fleetTypes: { bikes, vans, trucks },
        carriers: updatedCarriers,
        trend:    Math.random() > 0.6 ? (Math.random() > 0.5 ? 'up' : 'down') : city.trend,
        updatedAt: new Date(),
      };
      updated.hubUsed = Math.floor(city.hubCapacity * hubUtil);
      updated.deliveriesPerRider = parseFloat((completed / Math.max(1, riders)).toFixed(1));

      bulkOps.push({
        updateOne: { filter: { _id: city._id }, update: { $set: updated } },
      });
    }

    if (bulkOps.length) await City.bulkWrite(bulkOps);

    // Random alert ~40% chance
    let newAlert = null;
    if (Math.random() < 0.4) {
      const city = cities[rndInt(0, cities.length - 1)];
      const tpl  = TEMPLATES[rndInt(0, TEMPLATES.length - 1)];
      const data = tpl(city);
      newAlert = await Alert.create(data);
    }

    // Fetch updated cities
    const updatedCities = await City.find({}).lean();
    const kpis = computeKPIs(updatedCities);

    // Emit to all connected clients
    io.emit('data:tick', { cities: updatedCities, kpis });
    if (newAlert) io.emit('alert:new', newAlert);

  } catch (err) {
    console.error('Tick error:', err.message);
  }
}

module.exports = { tick, computeKPIs, getStatus };
