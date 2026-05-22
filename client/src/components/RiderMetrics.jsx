import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function RiderMetrics() {
  const { state } = useApp();

  const rows = useMemo(() =>
    [...state.cities]
      .map(c => ({
        name:             c.name,
        region:           c.region,
        riders:           c.riders,
        deliveriesPerDay: parseFloat((c.deliveriesPerRider ?? 0).toFixed(1)),
        slaCompliance:    parseFloat(((c.slaCompliance ?? 0) * 100).toFixed(1)),
        retryRate:        parseFloat(((c.retryRate ?? 0) * 100).toFixed(1)),
        pendingRetries:   c.pendingRetries || 0,
        avgDeliveryTime:  parseFloat((c.avgDeliveryTime ?? 0).toFixed(0)),
        slaWindow:        c.slaWindow || 60,
        status:           c.utilization >= 0.85 ? 'critical' : c.utilization >= 0.65 ? 'warning' : 'ok',
      }))
      .sort((a, b) => b.deliveriesPerDay - a.deliveriesPerDay),
    [state.cities]
  );

  const avgDeliveries = rows.length ? (rows.reduce((s, r) => s + r.deliveriesPerDay, 0) / rows.length).toFixed(1) : 0;
  const avgSLA        = rows.length ? (rows.reduce((s, r) => s + r.slaCompliance, 0) / rows.length).toFixed(1) : 0;
  const totalRetries  = rows.reduce((s, r) => s + r.pendingRetries, 0);

  return (
    <div className="zone-table-card card" style={{ marginTop: 0 }}>
      <div className="table-toolbar">
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700 }}>🛵 Rider Performance Metrics</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <span className="section-badge section-badge--brand">Sorted by deliveries/day</span>
          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.7rem', fontWeight: 600 }}>
            Avg {avgDeliveries} deliveries/rider/day
          </span>
          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.7rem', fontWeight: 600 }}>
            Avg SLA {avgSLA}%
          </span>
          {totalRetries > 0 && (
            <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--critical-dim)', color: 'var(--critical)', fontSize: '0.7rem', fontWeight: 600 }}>
              🔄 {totalRetries.toLocaleString()} total retries
            </span>
          )}
        </div>
      </div>
      <div className="table-wrap">
        <table className="zone-table">
          <thead>
            <tr>
              <th className="zt-th">#</th>
              <th className="zt-th">City</th>
              <th className="zt-th">Region</th>
              <th className="zt-th">Riders</th>
              <th className="zt-th">Deliveries/Day</th>
              <th className="zt-th">SLA Compliance</th>
              <th className="zt-th">SLA Window</th>
              <th className="zt-th">Retry Rate</th>
              <th className="zt-th">Retries/Day</th>
              <th className="zt-th">Avg Delivery Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const slaStatus   = r.slaCompliance > 90 ? 'ok' : r.slaCompliance > 80 ? 'warning' : 'critical';
              const slaBreached = r.avgDeliveryTime > r.slaWindow;
              return (
                <tr key={r.name} className="zone-row">
                  <td className="zt-rank">{i + 1}</td>
                  <td className="zt-city"><span className={`zt-dot zt-dot--${r.status}`} />{r.name}</td>
                  <td><span className="zt-badge zt-badge--region">{r.region}</span></td>
                  <td>{r.riders?.toLocaleString()}</td>
                  <td className="zt-num">
                    <span className={r.deliveriesPerDay > parseFloat(avgDeliveries) ? 'txt-ok' : ''}>
                      {r.deliveriesPerDay}
                    </span>
                  </td>
                  <td>
                    <div className="zt-bar-wrap">
                      <div className="zt-bar"><div className={`zt-bar-fill zt-bar-fill--${slaStatus}`} style={{ width: `${r.slaCompliance}%` }} /></div>
                      <span className={slaStatus === 'critical' ? 'txt-danger' : ''}>{r.slaCompliance}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    <span className={`zt-badge ${slaBreached ? 'zt-badge--critical' : 'zt-badge--ok'}`}>
                      {r.slaWindow} min
                    </span>
                  </td>
                  <td className={r.retryRate > 10 ? 'txt-warn' : ''}>{r.retryRate}%</td>
                  <td className={r.pendingRetries > 100 ? 'txt-warn' : ''}>
                    {r.pendingRetries.toLocaleString()}
                  </td>
                  <td className={slaBreached ? 'txt-danger' : r.avgDeliveryTime > 70 ? 'txt-warn' : ''}>
                    {r.avgDeliveryTime} min
                    {slaBreached && <span style={{ fontSize:'0.65rem', marginLeft:4 }}>⚠ SLA breach</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
