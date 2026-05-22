import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const TOOLTIP = {
  backgroundColor: '#1e293b', borderColor: 'rgba(148,163,184,0.2)',
  borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 12,
};

function statusColor(s) {
  if (s === 'offline')  return { bg:'rgba(244,63,94,0.15)', border:'#f43f5e', text:'#f43f5e' };
  if (s === 'degraded') return { bg:'rgba(245,158,11,0.15)', border:'#f59e0b', text:'#f59e0b' };
  return { bg:'rgba(16,185,129,0.12)', border:'#10b981', text:'#10b981' };
}

function CarrierTable({ cities }) {
  // Flatten all carriers across all cities
  const rows = [];
  cities.forEach(c => {
    (c.carriers || []).forEach(cr => {
      rows.push({
        carrier: cr.name,
        city:    c.name,
        region:  c.region,
        capacity: cr.capacity,
        available: cr.available,
        utilPct: parseFloat(((1 - cr.available / Math.max(1, cr.capacity)) * 100).toFixed(1)),
        status:  cr.status,
      });
    });
  });
  rows.sort((a, b) => a.status.localeCompare(b.status) || b.utilPct - a.utilPct);

  return (
    <div className="carrier-table-wrap">
      <table className="carrier-table">
        <thead>
          <tr>
            <th>Carrier</th>
            <th>City</th>
            <th>Region</th>
            <th>Capacity</th>
            <th>Available</th>
            <th>Load %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const col = statusColor(r.status);
            return (
              <tr key={i} className={`carrier-row carrier-row--${r.status}`}>
                <td className="carrier-name">
                  <span className="carrier-logo-dot" style={{ background: col.border }} />
                  {r.carrier}
                </td>
                <td>{r.city}</td>
                <td><span className="zt-badge zt-badge--region">{r.region}</span></td>
                <td>{r.capacity.toLocaleString()}</td>
                <td style={{ color: r.available < r.capacity * 0.2 ? '#f43f5e' : 'inherit' }}>
                  {r.available.toLocaleString()}
                </td>
                <td>
                  <div className="zt-bar-wrap">
                    <div className="zt-bar">
                      <div
                        className={`zt-bar-fill zt-bar-fill--${r.status === 'offline' ? 'critical' : r.status === 'degraded' ? 'warning' : 'ok'}`}
                        style={{ width: `${Math.min(r.utilPct, 100)}%` }}
                      />
                    </div>
                    <span>{r.utilPct}%</span>
                  </div>
                </td>
                <td>
                  <span className="carrier-status-pill" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}33` }}>
                    {r.status === 'offline' ? '🔴 Offline' : r.status === 'degraded' ? '🟡 Degraded' : '🟢 Active'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FleetDonut({ kpis }) {
  const bikes  = kpis?.totalBikes  || 0;
  const vans   = kpis?.totalVans   || 0;
  const trucks = kpis?.totalTrucks || 0;

  const data = {
    labels: ['🛵 Bikes', '🚐 Vans', '🚛 Trucks'],
    datasets: [{
      data: [bikes, vans, trucks],
      backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(168,85,247,0.8)'],
      borderColor: '#0f1629',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  return (
    <div style={{ height: 220 }}>
      <Doughnut data={data} options={{
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        animation: { duration: 800 },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, padding: 14, font: { family: 'Inter', size: 11 } } },
          tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} units` } },
        },
      }} />
    </div>
  );
}

function CarrierBar({ cities }) {
  const carrierTotals = {};
  cities.forEach(c => {
    (c.carriers || []).forEach(cr => {
      if (!carrierTotals[cr.name]) carrierTotals[cr.name] = { capacity: 0, available: 0 };
      carrierTotals[cr.name].capacity  += cr.capacity;
      carrierTotals[cr.name].available += cr.available;
    });
  });

  const names = Object.keys(carrierTotals);
  const data = {
    labels: names,
    datasets: [
      {
        label: 'Total Capacity',
        data: names.map(n => carrierTotals[n].capacity),
        backgroundColor: 'rgba(99,102,241,0.7)', borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 6,
      },
      {
        label: 'Available',
        data: names.map(n => carrierTotals[n].available),
        backgroundColor: 'rgba(16,185,129,0.7)', borderColor: '#10b981', borderWidth: 1.5, borderRadius: 6,
      },
    ],
  };

  return (
    <div style={{ height: 200 }}>
      <Bar data={data} options={{
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { family: 'Inter', size: 11 } } },
          tooltip: TOOLTIP,
        },
        scales: {
          x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#64748b', font: { family: 'Inter' } } },
          y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#64748b', font: { family: 'Inter' } } },
        },
      }} />
    </div>
  );
}

export default function CarrierFleetPanel() {
  const { state } = useApp();
  const { cities, kpis } = state;

  const offlineCount  = cities.flatMap(c => c.carriers || []).filter(cr => cr.status === 'offline').length;
  const degradedCount = cities.flatMap(c => c.carriers || []).filter(cr => cr.status === 'degraded').length;
  const totalBikes    = kpis?.totalBikes  || 0;
  const totalVans     = kpis?.totalVans   || 0;
  const totalTrucks   = kpis?.totalTrucks || 0;
  const totalFleet    = totalBikes + totalVans + totalTrucks;

  return (
    <div className="carrier-fleet-section">
      {/* Fleet Summary Strip */}
      <div className="fleet-summary-strip">
        <div className="fleet-summary-card">
          <span className="fleet-summary-icon">🛵</span>
          <div>
            <div className="fleet-summary-val">{totalBikes.toLocaleString()}</div>
            <div className="fleet-summary-label">Bikes</div>
          </div>
        </div>
        <div className="fleet-summary-card">
          <span className="fleet-summary-icon">🚐</span>
          <div>
            <div className="fleet-summary-val">{totalVans.toLocaleString()}</div>
            <div className="fleet-summary-label">Vans</div>
          </div>
        </div>
        <div className="fleet-summary-card">
          <span className="fleet-summary-icon">🚛</span>
          <div>
            <div className="fleet-summary-val">{totalTrucks.toLocaleString()}</div>
            <div className="fleet-summary-label">Trucks</div>
          </div>
        </div>
        <div className="fleet-summary-card">
          <span className="fleet-summary-icon">🚗</span>
          <div>
            <div className="fleet-summary-val">{totalFleet.toLocaleString()}</div>
            <div className="fleet-summary-label">Total Fleet</div>
          </div>
        </div>
        {offlineCount > 0 && (
          <div className="fleet-summary-card fleet-summary-card--alert">
            <span className="fleet-summary-icon">🔴</span>
            <div>
              <div className="fleet-summary-val txt-danger">{offlineCount}</div>
              <div className="fleet-summary-label">Carriers Offline</div>
            </div>
          </div>
        )}
        {degradedCount > 0 && (
          <div className="fleet-summary-card fleet-summary-card--warn">
            <span className="fleet-summary-icon">🟡</span>
            <div>
              <div className="fleet-summary-val txt-warn">{degradedCount}</div>
              <div className="fleet-summary-label">Carriers Degraded</div>
            </div>
          </div>
        )}
      </div>

      {/* Main panels */}
      <div className="carrier-fleet-grid">
        {/* Left: Carrier Status Table */}
        <div className="card carrier-table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700 }}>🚚 Carrier Partner Status</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {offlineCount > 0 && <span className="section-badge" style={{ background: 'var(--critical-dim)', color: 'var(--critical)', border: '1px solid rgba(244,63,94,0.25)' }}>🔴 {offlineCount} Offline</span>}
              {degradedCount > 0 && <span className="section-badge section-badge--brand">🟡 {degradedCount} Degraded</span>}
            </div>
          </div>
          <CarrierTable cities={cities} />
        </div>

        {/* Right: Charts */}
        <div className="carrier-charts-col">
          <div className="card" style={{ padding: '1.2rem' }}>
            <div className="chart-title" style={{ marginBottom: 12 }}>🚗 Fleet Type Distribution</div>
            <FleetDonut kpis={kpis} />
          </div>
          <div className="card" style={{ padding: '1.2rem' }}>
            <div className="chart-title" style={{ marginBottom: 12 }}>📊 Carrier Capacity vs Available</div>
            <CarrierBar cities={cities} />
          </div>
        </div>
      </div>
    </div>
  );
}
