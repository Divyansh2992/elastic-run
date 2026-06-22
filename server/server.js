require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { tick } = require('./services/dataEngine');

// ── Routes ────────────────────────────────────────
const citiesRouter = require('./routes/cities');
const alertsRouter = require('./routes/alerts');
const forecastRouter = require('./routes/forecast');
const routesRouter = require('./routes/routes');
const capacityRouter = require('./routes/capacity');

// ── App setup ─────────────────────────────────────
const app    = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];

const io     = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// ── Middleware ────────────────────────────────────
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// ── REST API ──────────────────────────────────────
app.use('/api/cities', citiesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/routes', routesRouter);
app.use('/api/capacity', capacityRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── Socket.io ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

});

// ── Start ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const TICK = parseInt(process.env.TICK_INTERVAL_MS) || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 LogiSense server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io live tick every ${TICK}ms`);

    // Start live data tick
    setInterval(() => tick(io), TICK);
  });
});
