const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Serve the pre-generated capacity planning JSON data
// Data is generated from Capacity_Planning_exp.xlsx by running:
// python3 dataset_template/extract_capacity.py

const DATA_FILE = path.join(__dirname, '../data/capacity_planning.json');

let cachedData = null;

function loadData() {
  if (!cachedData) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      cachedData = JSON.parse(raw);
    } catch (err) {
      console.error('⚠️  capacity_planning.json not found. Run extract script first.');
      return null;
    }
  }
  return cachedData;
}

// GET /api/capacity — full capacity planning data
router.get('/', (req, res) => {
  const data = loadData();
  if (!data) return res.status(503).json({ error: 'Capacity data not available. Run extraction script.' });
  res.json(data);
});

// GET /api/capacity/summary — summary only
router.get('/summary', (req, res) => {
  const data = loadData();
  if (!data) return res.status(503).json({ error: 'Capacity data not available.' });
  res.json({
    summary: data.summary,
    total_stations: data.total_stations,
    total_gap: data.total_gap,
  });
});

// GET /api/capacity/states — states with city-level data
router.get('/states', (req, res) => {
  const data = loadData();
  if (!data) return res.status(503).json({ error: 'Capacity data not available.' });
  // Return states without the full station-level detail to keep response small
  const states = data.states.map(s => ({
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    total_gap: s.total_gap,
    daily_load: s.daily_load,
    station_count: s.station_count,
    color: s.color,
    city_count: s.cities.length,
    cities: s.cities.map(c => ({
      city: c.city,
      lat: c.lat,
      lng: c.lng,
      total_gap: c.total_gap,
      daily_load: c.daily_load,
      station_count: c.station_count,
      color: c.color,
      stations: c.stations,
    })),
  }));
  res.json(states);
});

module.exports = router;
