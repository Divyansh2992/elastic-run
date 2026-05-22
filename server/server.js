require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const connectDB  = require('./config/db');
const { tick }   = require('./services/dataEngine');

// ── Routes ────────────────────────────────────────
const citiesRouter     = require('./routes/cities');
const alertsRouter     = require('./routes/alerts');
const forecastRouter   = require('./routes/forecast');
const simulationRouter = require('./routes/simulation');

// ── App setup ─────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// ── Middleware ────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// ── REST API ──────────────────────────────────────
app.use('/api/cities',     citiesRouter);
app.use('/api/alerts',     alertsRouter);
app.use('/api/forecast',   forecastRouter);
app.use('/api/simulate',   simulationRouter);

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

  // Simulation via socket (optional — also available via REST)
  socket.on('simulation:update', async (params) => {
    // Just acknowledge; client can use REST for simulation
    socket.emit('simulation:ack', { received: true, params });
  });
});

// ── Start ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const TICK  = parseInt(process.env.TICK_INTERVAL_MS) || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 LogiSense server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io live tick every ${TICK}ms`);

    // Start live data tick
    setInterval(() => tick(io), TICK);
  });
});
