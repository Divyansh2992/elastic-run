import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const TOOLTIP = {
  backgroundColor: '#1e293b', borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1,
  titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 12,
  mode: 'index', intersect: false,
  callbacks: {
    label: ctx => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString()} orders`,
    afterBody: (items) => {
      const d = items[0]?.parsed.y ?? 0;
      const c = items[1]?.parsed.y ?? 0;
      return d > c
        ? [`\n ⚠ Shortage: ${(d - c).toLocaleString()} orders`]
        : [`\n ✓ Surplus: ${(c - d).toLocaleString()} capacity`];
    },
  },
};

export default function ForecastChart() {
  const { state } = useApp();
  const forecast  = state.forecast;

  if (!forecast.length) return (
    <div className="forecast-card card">
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading forecast data…
      </div>
    </div>
  );

  const labels   = forecast.map(d => d.date.slice(5)); // "05-23"
  const demand   = forecast.map(d => d.demand);
  const capacity = forecast.map(d => d.capacity);
  const events   = forecast.filter(d => d.eventName);
  const shortageCount = forecast.filter(d => d.demand > d.capacity).length;

  // Build shortage shading segments
  const shortageZones = forecast.map((d, i) => ({
    index: i,
    isShortage: d.demand > d.capacity,
    deficit: d.demand - d.capacity,
  }));

  const data = {
    labels,
    datasets: [
      {
        label: 'Projected Demand',
        data: demand,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244,63,94,0.12)',
        tension: 0.4, fill: true,
        pointBackgroundColor: forecast.map(d =>
          d.eventName ? '#fbbf24' : d.demand > d.capacity ? '#dc2626' : '#f43f5e'
        ),
        pointRadius: forecast.map(d => d.eventName ? 8 : d.demand > d.capacity ? 6 : 3),
        pointBorderColor: forecast.map(d => d.eventName ? '#fbbf24' : 'transparent'),
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: 'Projected Capacity',
        data: capacity,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#10b981',
        pointRadius: 3, borderWidth: 2.5,
      },
    ],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 700 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 12, font: { family: 'Inter' } } },
      tooltip: TOOLTIP,
    },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#64748b', maxRotation: 45, font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#64748b', font: { family: 'Inter' } }, title: { display: true, text: 'Orders', color: '#64748b' } },
    },
  };

  return (
    <div className="forecast-card card">
      <div className="forecast-header">
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>📅 14-Day Demand Forecast</h3>
          {events.length > 0 && (
            <div className="forecast-events">
              {events.map(e => (
                <span key={e.dayOffset} className={`event-pill ${e.multiplier >= 2.0 ? 'event-pill--critical' : e.multiplier > 1.5 ? 'event-pill--high' : 'event-pill--med'}`}>
                  {e.multiplier >= 2.0 ? '🎆' : e.multiplier > 1.5 ? '🔥' : '📅'} {e.eventName} (D+{e.dayOffset}) ×{e.multiplier}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {shortageCount > 0 && (
            <span className="forecast-shortage-badge">
              ⚠ {shortageCount} days with projected shortage
            </span>
          )}
          {events.length > 0 && (
            <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', fontSize: '0.72rem', fontWeight: 600 }}>
              📅 {events.length} upcoming event{events.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="forecast-wrap">
        <Line data={data} options={options} />
      </div>

      {/* Shortage day detail */}
      {shortageCount > 0 && (
        <div className="forecast-shortage-detail">
          <div className="forecast-shortage-detail-title">⚠ Shortage Days — Early Action Required:</div>
          <div className="forecast-shortage-days">
            {shortageZones.filter(z => z.isShortage).map(z => {
              const d = forecast[z.index];
              return (
                <div key={z.index} className="forecast-shortage-day">
                  <span className="fsd-date">{d.date.slice(5)}</span>
                  {d.eventName && <span className="fsd-event">{d.eventName}</span>}
                  <span className="fsd-deficit txt-danger">-{z.deficit.toLocaleString()} slots</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="forecast-note">
        <span>⚠</span>
        <span>Red areas indicate projected demand exceeding capacity. Pre-book carrier contracts and activate standby riders 48h before flagged dates. Yellow dots indicate festival/event days with demand multipliers.</span>
      </div>
    </div>
  );
}
