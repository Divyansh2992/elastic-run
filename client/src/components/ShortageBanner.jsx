import { useState } from 'react';
import { useApp } from '../context/useApp';

export default function ShortageBanner() {
  const { state } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const shortageCities = state.cities.filter(c => c.shortage);
  if (shortageCities.length === 0) return null;

  return (
    <div className={`shortage-banner ${collapsed ? 'shortage-banner--collapsed' : ''}`} role="alert" aria-live="assertive">
      <div className="shortage-banner-header" onClick={() => setCollapsed(v => !v)}>
        <div className="shortage-banner-title">
          <span className="shortage-pulse" />
          <span className="shortage-icon">🔴</span>
          <strong>{shortageCities.length} Zone{shortageCities.length > 1 ? 's' : ''} — Demand Exceeds Capacity</strong>
          <span className="shortage-sub">Immediate capacity rebalancing required</span>
        </div>
        <button className="shortage-collapse-btn" aria-label="Toggle shortage banner">
          {collapsed ? '▼ Show' : '▲ Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="shortage-cities-grid">
          {shortageCities.map(c => {
            const demand  = c.pending + c.completed;
            const deficit = demand - c.capacity;
            const severity = deficit > 500 ? 'critical' : deficit > 200 ? 'high' : 'medium';
            return (
              <div key={c.id} className={`shortage-city-card shortage-city-card--${severity}`}>
                <div className="shortage-city-name">
                  <span className={`shortage-sev-dot shortage-sev-dot--${severity}`} />
                  {c.name}
                  <span className="shortage-region-badge">{c.region}</span>
                </div>
                <div className="shortage-metrics">
                  <div className="shortage-metric">
                    <span className="shortage-metric-label">Demand</span>
                    <span className="shortage-metric-val txt-danger">{demand.toLocaleString()}</span>
                  </div>
                  <div className="shortage-metric">
                    <span className="shortage-metric-label">Capacity</span>
                    <span className="shortage-metric-val">{c.capacity.toLocaleString()}</span>
                  </div>
                  <div className="shortage-metric">
                    <span className="shortage-metric-label">Deficit</span>
                    <span className="shortage-metric-val txt-danger">-{deficit.toLocaleString()}</span>
                  </div>
                  <div className="shortage-metric">
                    <span className="shortage-metric-label">Riders</span>
                    <span className="shortage-metric-val">{c.riders?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="shortage-action">
                  <span className="shortage-action-text">
                    {deficit > 500
                      ? '🚨 Emergency carrier contract required'
                      : deficit > 200
                      ? '⚠️ Pre-book additional capacity'
                      : '📋 Monitor & redistribute riders'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
