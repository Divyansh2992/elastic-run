const express = require('express');
const router  = express.Router();
const Route   = require('../models/Route');

// GET /api/routes?search=... — search routes by ID, city, partner, mode, or vehicle type
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let routes;

    if (search && search.trim()) {
      const query = new RegExp(search.trim(), 'i');
      routes = await Route.find({
        $or: [
          { routeId: query },
          { 'origin.cityName': query },
          { 'destination.cityName': query },
          { 'origin.id': query },
          { 'destination.id': query },
          { partner: query },
          { mode: query },
          { vehicleType: query },
        ],
      })
        .limit(200)
        .lean();
    } else {
      routes = await Route.find({}).limit(200).lean();
    }

    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/routes/location/:cityId — route lanes for a city zone
router.get('/location/:cityId', async (req, res) => {
  try {
    const cityId = req.params.cityId;
    const routes = await Route.find({
      $or: [
        { 'origin.id': cityId },
        { 'destination.id': cityId },
      ],
    })
      .limit(200)
      .lean();

    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/routes/:routeId — single route by routeId
router.get('/:routeId', async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId }).lean();
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
