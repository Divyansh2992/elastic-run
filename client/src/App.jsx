import { AppProvider } from './context/AppContext';
import Header           from './components/Header';
import KPIStrip         from './components/KPIStrip';
import MapHeatmap       from './components/MapHeatmap';
import ChartsRow        from './components/ChartsRow';
import ForecastChart    from './components/ForecastChart';
import ZoneTable        from './components/ZoneTable';
import SimulationPanel  from './components/SimulationPanel';
import RiderMetrics     from './components/RiderMetrics';
import CarrierFleetPanel from './components/CarrierFleetPanel';
import ShortageBanner   from './components/ShortageBanner';
import { useApp }       from './context/AppContext';

function Dashboard() {
  const { state } = useApp();

  if (state.loading) return (
    <div className="loading-screen">
      <div className="loading-logo">🚚</div>
      <div className="loading-text">LogiSense</div>
      <div className="loading-sub">Connecting to logistics network…</div>
      <div className="loading-bar"><div className="loading-bar-fill" /></div>
    </div>
  );

  if (state.error) return (
    <div className="error-screen">
      <div style={{ fontSize: '2.5rem' }}>⚠️</div>
      <h2>Connection Failed</h2>
      <p>{state.error}</p>
      <p style={{ fontSize: '0.78rem', marginTop: 8 }}>
        Make sure the server is running: <code>npm run dev</code>
      </p>
      <button className="btn btn--primary" onClick={() => window.location.reload()} style={{ marginTop: 16 }}>
        ↺ Retry
      </button>
    </div>
  );

  return (
    <div className="app">
      <Header />

      {/* Shortage Banner — sticky contextual alert */}
      <ShortageBanner />

      <main className="main">

        {/* ── Step 1: Real-Time KPI Dashboard ────────── */}
        <section aria-labelledby="kpi-heading">
          <div className="section-header">
            <div>
              <h1 id="kpi-heading" className="section-title">
                <span className="title-icon">📊</span> Real-Time Capacity Dashboard
              </h1>
              <p className="section-desc">Live metrics across all 15 Pan-India delivery zones — riders, vehicles, hubs, SLA, and shortage status</p>
            </div>
            <span className="section-badge section-badge--live">● Live Feed</span>
          </div>
          <KPIStrip />
        </section>

        {/* ── Step 2: Map-Based Heatmap ───────────────── */}
        <section aria-labelledby="map-heading">
          <div className="section-header">
            <div>
              <h2 id="map-heading" className="section-title">
                <span className="title-icon">🗺️</span> Zone Heatmap — India
              </h2>
              <p className="section-desc">
                🟢 Healthy &nbsp;·&nbsp; 🟡 Medium Load &nbsp;·&nbsp; 🔴 Overloaded &nbsp;·&nbsp; 🔴 Shortage (demand &gt; capacity)
              </p>
            </div>
          </div>
          <MapHeatmap />
        </section>

        {/* ── Operations Analytics ─────────────────────── */}
        <section aria-labelledby="charts-heading">
          <div className="section-header">
            <div>
              <h2 id="charts-heading" className="section-title">
                <span className="title-icon">📈</span> Operations Analytics
              </h2>
              <p className="section-desc">Demand vs capacity by city, first-mile vs last-mile performance, and rider delivery distribution</p>
            </div>
            <span className="section-badge section-badge--brand">Socket.io live</span>
          </div>
          <ChartsRow />
        </section>

        {/* ── Step 3: Demand Forecast ───────────────────── */}
        <section aria-labelledby="forecast-heading">
          <div className="section-header">
            <div>
              <h2 id="forecast-heading" className="section-title">
                <span className="title-icon">🔮</span> 14-Day Demand Forecast
              </h2>
              <p className="section-desc">Festival events, weekend surges, and projected shortage windows — pre-book carriers before failures occur</p>
            </div>
          </div>
          <ForecastChart />
        </section>

        {/* ── Carrier & Fleet Status ───────────────────── */}
        <section aria-labelledby="carrier-heading">
          <div className="section-header">
            <div>
              <h2 id="carrier-heading" className="section-title">
                <span className="title-icon">🚚</span> Carrier &amp; Fleet Status
              </h2>
              <p className="section-desc">BlueDart, Delhivery, and Xpressbees capacity — fleet type breakdown (bikes/vans/trucks) across all zones</p>
            </div>
          </div>
          <CarrierFleetPanel />
        </section>

        {/* ── Zone Table + Simulation ──────────────────── */}
        <section aria-labelledby="zone-heading">
          <div className="section-header">
            <div>
              <h2 id="zone-heading" className="section-title">
                <span className="title-icon">🏙️</span> Zone Capacity &amp; Scenario Simulation
              </h2>
              <p className="section-desc">Sortable zone table with shortage/SLA/retry data — run what-if simulations for festival demand or carrier failure</p>
            </div>
          </div>
          <div className="bottom-section">
            <ZoneTable />
            <SimulationPanel />
          </div>
        </section>

        {/* ── Rider Performance Metrics ────────────────── */}
        <section aria-labelledby="rider-heading">
          <div className="section-header">
            <div>
              <h2 id="rider-heading" className="section-title">
                <span className="title-icon">🛵</span> Rider Performance Metrics
              </h2>
              <p className="section-desc">Deliveries per rider per day, SLA compliance vs promised window, retry rates, and on-ground capacity assessment</p>
            </div>
          </div>
          <RiderMetrics />
        </section>

      </main>

      <footer className="footer">
        <span>LogiSense © 2025 — MERN Stack Real-Time Logistics Capacity Dashboard</span>
        <span style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="live-dot">Socket.io connected</span>
          <span>MongoDB Atlas · Express · React · Node.js</span>
        </span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
