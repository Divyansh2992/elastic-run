const express = require('express');
const router  = express.Router();
const Alert   = require('../models/Alert');

// GET /api/alerts?limit=20 — latest alerts
router.get('/', async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 20;
    const alerts = await Alert.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/counts — critical / warning / info counts
router.get('/counts', async (req, res) => {
  try {
    const [critical, warning, info] = await Promise.all([
      Alert.countDocuments({ type: 'critical' }),
      Alert.countDocuments({ type: 'warning' }),
      Alert.countDocuments({ type: 'info' }),
    ]);
    res.json({ critical, warning, info, total: critical + warning + info });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
