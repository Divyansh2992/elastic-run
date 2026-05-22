const express = require('express');
const router  = express.Router();
const City    = require('../models/City');
const { computeKPIs, getStatus } = require('../services/dataEngine');

// GET /api/cities — all city data with status
router.get('/', async (req, res) => {
  try {
    const cities = await City.find({}).lean();
    const withStatus = cities.map(c => ({
      ...c,
      status:      getStatus(c.utilization),
      statusLabel: c.utilization >= 0.85 ? 'Overloaded' : c.utilization >= 0.65 ? 'Medium Load' : 'Healthy',
    }));
    res.json(withStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cities/kpis — aggregated KPI metrics
router.get('/kpis', async (req, res) => {
  try {
    const cities = await City.find({}).lean();
    const kpis   = computeKPIs(cities);
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cities/:id — single city
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findOne({ id: req.params.id }).lean();
    if (!city) return res.status(404).json({ error: 'City not found' });
    res.json({ ...city, status: getStatus(city.utilization) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
