const express  = require('express');
const router   = express.Router();
const Forecast = require('../models/Forecast');

// GET /api/forecast — full 14-day forecast
router.get('/', async (req, res) => {
  try {
    const forecast = await Forecast.find({})
      .sort({ dayOffset: 1 })
      .lean();
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
