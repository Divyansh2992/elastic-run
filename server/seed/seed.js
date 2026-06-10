// ===================================================
// Seed Script — populates MongoDB with initial data
// Run: cd server && npm run seed
// ===================================================

require('dotenv').config();
const mongoose  = require('mongoose');
const connectDB = require('../config/db');
const City      = require('../models/City');
const Route     = require('../models/Route');
const Alert     = require('../models/Alert');
const Forecast  = require('../models/Forecast');

// ── City master data ──────────────────────────────
const CITIES_BASE = [
  { id:'del', name:'Delhi',      region:'North',   lat:28.6139, lng:77.2090 },
  { id:'mum', name:'Mumbai',     region:'West',    lat:19.0760, lng:72.8777 },
  { id:'blr', name:'Bengaluru',  region:'South',   lat:12.9716, lng:77.5946 },
  { id:'che', name:'Chennai',    region:'South',   lat:13.0827, lng:80.2707 },
  { id:'hyd', name:'Hyderabad',  region:'South',   lat:17.3850, lng:78.4867 },
  { id:'pun', name:'Pune',       region:'West',    lat:18.5204, lng:73.8567 },
  { id:'kol', name:'Kolkata',    region:'East',    lat:22.5726, lng:88.3639 },
  { id:'ahm', name:'Ahmedabad',  region:'West',    lat:23.0225, lng:72.5714 },
  { id:'jai', name:'Jaipur',     region:'North',   lat:26.9124, lng:75.7873 },
  { id:'luc', name:'Lucknow',    region:'North',   lat:26.8467, lng:80.9462 },
  { id:'sur', name:'Surat',      region:'West',    lat:21.1702, lng:72.8311 },
  { id:'bho', name:'Bhopal',     region:'Central', lat:23.2599, lng:77.4126 },
  { id:'chd', name:'Chandigarh', region:'North',   lat:30.7333, lng:76.7794 },
  { id:'koc', name:'Kochi',      region:'South',   lat:9.9312,  lng:76.2673 },
  { id:'nag', name:'Nagpur',     region:'Central', lat:21.1458, lng:79.0882 },
];

// ── Carrier partners ──────────────────────────────
const CARRIER_NAMES = ['BlueDart', 'Delhivery', 'Xpressbees'];

// ── Festival & seasonal events ────────────────────
const EVENTS = [
  { dayOffset:1,  name:'Weekend',          multiplier:1.18, isWeekend:true  },
  { dayOffset:2,  name:'Weekend Surge',    multiplier:1.25, isWeekend:true  },
  { dayOffset:4,  name:'Flash Sale',       multiplier:1.65, isWeekend:false },
  { dayOffset:7,  name:'Eid Holiday',      multiplier:1.80, isWeekend:false },
  { dayOffset:8,  name:'Weekend',          multiplier:1.30, isWeekend:true  },
  { dayOffset:9,  name:'Weekend',          multiplier:1.25, isWeekend:true  },
  { dayOffset:11, name:'Founder Day Sale', multiplier:1.45, isWeekend:false },
  { dayOffset:13, name:'Diwali Pre-Rush',  multiplier:2.10, isWeekend:false },
];

function rnd(min, max) { return min + Math.random() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }

function buildCarriers(vehicles) {
  // Distribute vehicle capacity across 3 carriers
  return CARRIER_NAMES.map((name, i) => {
    const share    = [0.40, 0.35, 0.25][i];
    const capacity = Math.floor(vehicles * share * rnd(0.8, 1.2));
    const available= Math.floor(capacity * rnd(0.3, 0.95));
    const pct      = available / Math.max(1, capacity);
    const status   = pct < 0.15 ? 'offline' : pct < 0.35 ? 'degraded' : 'active';
    return { name, capacity, available, status };
  });
}

function buildCity(base) {
  const capacity    = rndInt(800, 3500);
  const utilization = parseFloat(rnd(0.35, 0.95).toFixed(4));
  const riders      = rndInt(200, 1200);
  const vehicles    = rndInt(80, 400);
  const pending     = Math.floor(capacity * utilization * rnd(0.2, 0.4));
  const completed   = Math.floor(capacity * utilization * rnd(0.5, 0.75));
  const hubCapacity = rndInt(5000, 20000);
  const hubUtil     = parseFloat(rnd(0.3, 0.97).toFixed(4));
  const hubUsed     = Math.floor(hubCapacity * hubUtil);
  const retryRate   = parseFloat(rnd(0.02, 0.15).toFixed(4));
  const shortage    = (pending + completed) > capacity;

  // Fleet type breakdown
  const bikes  = Math.floor(vehicles * rnd(0.50, 0.60));
  const vans   = Math.floor(vehicles * rnd(0.25, 0.32));
  const trucks = vehicles - bikes - vans;

  const avgDeliveryTime = parseFloat(rnd(28, 95).toFixed(1));
  const slaWindow       = rndInt(45, 90);  // promised delivery window in minutes

  return {
    ...base,
    capacity, utilization, riders, vehicles, pending, completed,
    hubCapacity, hubUsed, hubUtil,
    successRate:      parseFloat(rnd(0.82, 0.98).toFixed(4)),
    delayRate:        parseFloat(rnd(0.03, 0.18).toFixed(4)),
    slaCompliance:    parseFloat(rnd(0.75, 0.98).toFixed(4)),
    retryRate,
    avgDeliveryTime,
    slaWindow,
    pendingRetries:   Math.floor(completed * retryRate),
    deliveriesPerRider: parseFloat((completed / Math.max(1, riders)).toFixed(1)),
    firstMile: Array.from({length:7}, ()=>rndInt(200,900)),
    lastMile:  Array.from({length:7}, ()=>rndInt(500,2000)),
    trend: Math.random() > 0.5 ? 'up' : 'down',
    shortage,
    fleetTypes: { bikes, vans, trucks },
    carriers:   buildCarriers(vehicles),
  };
}

function buildForecast(cities) {
  const today = new Date();
  const baseDemand   = cities.reduce((s, c) => s + c.pending + c.completed, 0);
  const baseCapacity = cities.reduce((s, c) => s + c.capacity, 0);
  const docs = [];

  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().slice(0,10);

    const event = EVENTS.find(e => e.dayOffset === d);
    const dow   = date.getDay();
    const isWeekend = dow === 0 || dow === 6;

    let mult = 1.0;
    if (event) mult = event.multiplier;
    else if (isWeekend) mult = 1.18;

    const demand   = Math.floor(baseDemand   * mult * (1 + d * 0.005));
    const capacity = Math.floor(baseCapacity * (1 + d * 0.003));

    docs.push({
      date:      dateStr,
      dayOffset: d,
      demand,
      capacity,
      eventName:  event?.name || null,
      multiplier: parseFloat(mult.toFixed(2)),
      isWeekend:  !event && isWeekend,
    });
  }
  return docs;
}

const ROUTE_AREAS = ['Central Hub', 'North Depot', 'East Terminal', 'West Yard', 'South Cargo Park', 'Airport Gate', 'Industrial Park', 'Gateway Terminal', 'Logistics Park'];
const PRODUCT_TYPES = ['FMCG', 'Pharma', 'E-commerce', 'Industrial', 'Electronics'];
const ROUTE_STOPS   = ['Kalyan', 'Lonavala', 'Daund', 'Pune MIDC', 'Vadodara', 'Ahmedabad Hub', 'Nagpur Junction', 'Bhopal Yard', 'Jaipur Expressway', 'Bengaluru Outer'];
const ROUTE_VEHICLES = {
  road: ['truck', 'van', 'bus'],
  rail: ['container', 'trailer'],
  air: ['cargo-plane'],
  sea: ['container'],
};

function pickArea(city) {
  return `${city.name} ${ROUTE_AREAS[rndInt(0, ROUTE_AREAS.length - 1)]}`;
}

function pickStops(origin, destination) {
  const routeStops = [...ROUTE_STOPS].filter(name => ![origin.cityName, destination.cityName].includes(name));
  const count = rndInt(0, 3);
  const shuffled = routeStops.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildRoute(origin, destination, index) {
  const modeChance = Math.random();
  const mode = modeChance < 0.65 ? 'road' : modeChance < 0.88 ? 'rail' : 'air';
  const vehicles = ROUTE_VEHICLES[mode];
  const vehicleType = vehicles[rndInt(0, vehicles.length - 1)];
  const productCount = rndInt(1, 2);
  const productTypes = Array.from({ length: productCount }, () => PRODUCT_TYPES[rndInt(0, PRODUCT_TYPES.length - 1)]);
  const capacity = Math.floor((mode === 'road' ? rndInt(70, 180) : mode === 'rail' ? rndInt(180, 420) : rndInt(20, 90)) * (productCount + 1));
  const available = Math.max(1, Math.floor(capacity * rnd(0.15, 0.85)));
  const utilization = parseFloat(((capacity - available) / Math.max(1, capacity)).toFixed(4));
  const distanceKm = mode === 'road' ? rndInt(140, 360) : mode === 'rail' ? rndInt(220, 700) : rndInt(350, 900);
  const transitTimeMin = mode === 'road' ? rndInt(180, 420) : mode === 'rail' ? rndInt(240, 750) : rndInt(240, 540);
  const frequencyPerDay = mode === 'road' ? rndInt(2, 6) : mode === 'rail' ? rndInt(1, 3) : rndInt(1, 2);
  const status = available / Math.max(1, capacity) < 0.15 ? 'offline' : available / Math.max(1, capacity) < 0.35 ? 'degraded' : 'active';

  return {
    routeId: `route-${origin.id}-${destination.id}-${index}`,
    origin: {
      id: origin.id,
      cityName: origin.name,
      region: origin.region,
      area: pickArea(origin),
    },
    destination: {
      id: destination.id,
      cityName: destination.name,
      region: destination.region,
      area: pickArea(destination),
    },
    mode,
    vehicleType,
    partner: CARRIER_NAMES[rndInt(0, CARRIER_NAMES.length - 1)],
    productTypes: Array.from(new Set(productTypes)),
    capacity,
    available,
    utilization,
    stops: pickStops(origin, destination),
    transitTimeMin,
    distanceKm,
    frequencyPerDay,
    status,
  };
}

function buildRoutes(cities) {
  const routes = [];
  cities.forEach(origin => {
    const destinations = cities
      .filter(dest => dest.id !== origin.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, rndInt(3, 5));

    destinations.forEach((destination, index) => {
      const count = rndInt(1, 2);
      for (let i = 0; i < count; i += 1) {
        routes.push(buildRoute(origin, destination, routes.length + 1));
      }
    });
  });
  return routes;
}

const SEED_ALERTS = [
  { type:'critical', icon:'🔴', msg:'Capacity CRITICAL in Delhi — 92% utilization',                      city:'Delhi' },
  { type:'warning',  icon:'🟡', msg:'Mumbai hub nearing full capacity — 87% used',                        city:'Mumbai' },
  { type:'warning',  icon:'🟡', msg:'Rider shortage detected in Bengaluru: 210 active, demand rising',    city:'Bengaluru' },
  { type:'critical', icon:'🔴', msg:'SLA breach risk in Chennai — avg delay 82 min vs 60 min promised',   city:'Chennai' },
  { type:'warning',  icon:'🟡', msg:'High retry rate in Hyderabad: 12.4% of deliveries',                 city:'Hyderabad' },
  { type:'critical', icon:'🔴', msg:'Demand EXCEEDS capacity in Kolkata — shortage of 340 slots',         city:'Kolkata' },
  { type:'warning',  icon:'🟡', msg:'Carrier Delhivery degraded in Jaipur — rerouting to Xpressbees',   city:'Jaipur' },
  { type:'info',     icon:'🟢', msg:'Fleet rebalancing complete — 42 vehicles redistributed to North zone', city:null },
  { type:'warning',  icon:'🟡', msg:'Weather alert: heavy rain expected in Mumbai, Pune — delays likely', city:null },
  { type:'info',     icon:'🟢', msg:'Festival demand model updated — 14-day forecast recalculated',        city:null },
  { type:'critical', icon:'🔴', msg:'Xpressbees capacity constraint — activating emergency carrier pool', city:null },
  { type:'warning',  icon:'🟡', msg:'Diwali Pre-Rush demand spike expected in 13 days — begin planning',  city:null },
];

async function seed() {
  await connectDB();

  console.log('🗑️  Clearing existing data...');
  await City.deleteMany({});
  await Route.deleteMany({});
  await Alert.deleteMany({});
  await Forecast.deleteMany({});

  console.log('🌱 Seeding cities...');
  const cityDocs = CITIES_BASE.map(buildCity);
  const cities   = await City.insertMany(cityDocs);
  console.log(`   ✅ ${cities.length} cities inserted (with fleet types & carriers)`);

  console.log('🛣️  Seeding routes...');
  const routeDocs = buildRoutes(cityDocs);
  await Route.insertMany(routeDocs);
  console.log(`   ✅ ${routeDocs.length} routes inserted`);

  console.log('📅 Seeding 14-day forecast...');
  const forecastDocs = buildForecast(cityDocs);
  await Forecast.insertMany(forecastDocs);
  console.log(`   ✅ ${forecastDocs.length} forecast days inserted`);

  console.log('🔔 Seeding alerts...');
  await Alert.insertMany(SEED_ALERTS);
  console.log(`   ✅ ${SEED_ALERTS.length} alerts inserted`);

  console.log('\n🎉 Seed complete! You can now start the server with: npm run dev');
  mongoose.connection.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
