# LogiSense — Real-Time Logistics Capacity Dashboard (MERN)

A full-stack **MERN** (MongoDB · Express · React · Node.js) real-time logistics dashboard for pan-India operations. Live data via **Socket.io**, interactive map via **react-leaflet**, and charts via **react-chartjs-2**.

---

## Tech Stack

| Layer     | Technology            |
|-----------|-----------------------|
| Database  | MongoDB Atlas (Mongoose) |
| Backend   | Node.js + Express.js  |
| Realtime  | Socket.io             |
| Frontend  | React 18 + Vite       |
| Map       | react-leaflet + leaflet.heat |
| Charts    | react-chartjs-2 / Chart.js |

---

## Project Structure

```
logistics-mern/
├── package.json          ← Root scripts (run both server + client)
├── server/
│   ├── .env.example      ← Copy to .env and add your MongoDB URI
│   ├── server.js         ← Express + Socket.io entry point
│   ├── config/db.js      ← Mongoose connection
│   ├── models/           ← City, Alert, Forecast schemas
│   ├── routes/           ← /api/cities, /api/alerts, /api/forecast, /api/simulate
│   ├── services/dataEngine.js  ← Live data tick logic
│   └── seed/seed.js      ← Database seeder
└── client/
    ├── vite.config.js    ← Proxy /api → :5000
    └── src/
        ├── App.jsx
        ├── context/AppContext.jsx   ← Global state + Socket.io
        ├── hooks/useSimulation.js
        ├── services/api.js          ← Axios + socket.io-client
        └── components/             ← All UI components
```

---

## 🚀 Quick Start

### Step 1 — Configure MongoDB Atlas

```bash
cd server
cp .env.example .env
```

Open `server/.env` and paste your **MongoDB Atlas connection string**:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/logisense?retryWrites=true&w=majority
PORT=5000
TICK_INTERVAL_MS=5000
```

> **Get a free Atlas cluster** at [mongodb.com/atlas](https://www.mongodb.com/atlas) if you don't have one.
> Make sure to **whitelist your IP** in Atlas Network Access.

---

### Step 2 — Install dependencies

```bash
# From the logistics-mern/ root:
npm run install:all
```

Or manually:
```bash
cd server && npm install
cd ../client && npm install
```

---

### Step 3 — Seed the database

```bash
npm run seed
```

This populates MongoDB with:
- **15 Indian cities** (Delhi, Mumbai, Bengaluru, etc.) with full metrics
- **14-day demand forecast** with festival events
- **8 initial alerts**

Expected output:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🗑️  Clearing existing data...
🌱 Seeding cities...
   ✅ 15 cities inserted
📅 Seeding 14-day forecast...
   ✅ 14 forecast days inserted
🔔 Seeding alerts...
   ✅ 8 alerts inserted

🎉 Seed complete!
```

---

### Step 4 — Start the app

```bash
# From logistics-mern/ root — starts both server and client:
npm run dev
```

| Service  | URL                        |
|----------|---------------------------|
| React UI | http://localhost:5173      |
| API      | http://localhost:5000/api  |
| Health   | http://localhost:5000/api/health |

---

## API Reference

| Method | Endpoint          | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | `/api/cities`     | All 15 cities with status            |
| GET    | `/api/cities/kpis`| Aggregated KPI metrics               |
| GET    | `/api/cities/:id` | Single city by ID                    |
| GET    | `/api/alerts`     | Latest alerts (pass `?limit=N`)      |
| GET    | `/api/forecast`   | 14-day demand forecast               |
| POST   | `/api/simulate`   | Run scenario simulation              |
| GET    | `/api/health`     | Server health check                  |

### Simulation Body (POST `/api/simulate`)

```json
{
  "demandMultiplier":  1.8,
  "carrierFailurePct": 20,
  "extraRiders":       500
}
```

---

## Socket.io Events

| Direction       | Event        | Payload                          |
|-----------------|--------------|----------------------------------|
| Server → Client | `data:tick`  | `{ cities[], kpis{} }` every 5s |
| Server → Client | `alert:new`  | Single alert object              |

---

## Dashboard Features

- 📊 **8 animated KPI cards** — capacity, riders, vehicles, orders, success/delay rates, hub utilization
- 🗺️ **Interactive India map** — 🟢🟡🔴 heatmap, 3 view modes, clickable city popups
- 📈 **3 live charts** — Demand vs Capacity, First/Last Mile, Rider Distribution
- 🔮 **14-day forecast** — with festival event markers and shortage warnings
- 🏙️ **Sortable zone table** — filter by city/region, click headers to sort
- 🛵 **Rider metrics table** — SLA compliance, retry rate, avg delivery time
- 🧪 **Scenario Simulator** — demand multiplier, carrier failure, extra riders → live impact
- 🔔 **Live alert feed** — streaming via Socket.io with critical/warning/info types
