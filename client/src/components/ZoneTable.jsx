import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

function getStatus(u) {
  if (u >= 0.85) return 'critical';
  if (u >= 0.65) return 'warning';
  return 'ok';
}
function getStatusLabel(u, shortage) {
  if (shortage)  return 'Shortage';
  if (u >= 0.85) return 'Overloaded';
  if (u >= 0.65) return 'Medium Load';
  return 'Healthy';
}

export default function ZoneTable() {
  const { state } = useApp();
  const [sort,   setSort]   = useState({ col: 'utilization', dir: -1 });
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    let data = state.cities.map(c => ({
      ...c,
      status:      getStatus(c.utilization),
      statusLabel: getStatusLabel(c.utilization, c.shortage),
    }));
    if (filter) {
      const q = filter.toLowerCase();
      data = data.filter(r => r.name?.toLowerCase().includes(q) || r.region?.toLowerCase().includes(q));
    }
    data.sort((a, b) => {
      const va = a[sort.col] ?? 0;
      const vb = b[sort.col] ?? 0;
      return sort.dir * (typeof va === 'string' ? va.localeCompare(vb) : va - vb);
    });
    return data;
  }, [state.cities, sort, filter]);

  const handleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col ? -s.dir : -1 }));
  };

  const Th = ({ col, children }) => (
    <th
      className={`zt-th ${sort.col === col ? (sort.dir === -1 ? 'sorted-desc' : 'sorted-asc') : ''}`}
      data-col={col}
      onClick={() => handleSort(col)}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </th>
  );

  const shortageCount = rows.filter(r => r.shortage).length;

  return (
    <div className="zone-table-card card">
      <div className="table-toolbar">
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700 }}>🏙️ Zone Capacity</h3>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {shortageCount > 0 && (
            <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--critical-dim)', color: 'var(--critical)', border: '1px solid rgba(244,63,94,0.25)', fontSize: '0.7rem', fontWeight: 600 }}>
              🔴 {shortageCount} shortage zone{shortageCount > 1 ? 's' : ''}
            </span>
          )}
          <input
            type="search"
            className="search-input"
            placeholder="🔍  Filter city / region…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="table-wrap">
        <table className="zone-table">
          <thead>
            <tr>
              <Th col="name">City</Th>
              <Th col="region">Region</Th>
              <Th col="capacity">Capacity</Th>
              <Th col="utilization">Utilization</Th>
              <Th col="riders">Riders</Th>
              <Th col="vehicles">Vehicles</Th>
              <Th col="hubUtil">Hub Fill</Th>
              <Th col="slaCompliance">SLA %</Th>
              <Th col="pendingRetries">Retries</Th>
              <Th col="shortage">Shortage</Th>
              <th className="zt-th">Status</th>
              <Th col="trend">Trend</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const hubStatus = r.hubUtil >= 0.85 ? 'critical' : r.hubUtil >= 0.65 ? 'warning' : 'ok';
              const slaStatus = r.slaCompliance < 0.80 ? 'critical' : r.slaCompliance < 0.90 ? 'warning' : 'ok';
              return (
                <tr key={r.id} className={`zone-row zone-row--${r.shortage ? 'shortage' : r.status}`}>
                  <td className="zt-city">
                    <span className={`zt-dot zt-dot--${r.shortage ? 'shortage' : r.status}`} />
                    {r.name}
                  </td>
                  <td><span className="zt-badge zt-badge--region">{r.region}</span></td>
                  <td>{r.capacity?.toLocaleString()}</td>
                  <td>
                    <div className="zt-bar-wrap">
                      <div className="zt-bar"><div className={`zt-bar-fill zt-bar-fill--${r.shortage ? 'critical' : r.status}`} style={{ width: `${Math.min(r.utilization * 100, 100).toFixed(0)}%` }} /></div>
                      <span>{(r.utilization * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td>{r.riders?.toLocaleString()}</td>
                  <td>{r.vehicles}</td>
                  <td>
                    <div className="zt-bar-wrap">
                      <div className="zt-bar"><div className={`zt-bar-fill zt-bar-fill--${hubStatus}`} style={{ width: `${(r.hubUtil * 100).toFixed(0)}%` }} /></div>
                      <span>{(r.hubUtil * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`zt-badge zt-badge--${slaStatus}`}>
                      {((r.slaCompliance || 0) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className={r.pendingRetries > 100 ? 'txt-warn' : ''}>{(r.pendingRetries || 0).toLocaleString()}</td>
                  <td>
                    {r.shortage
                      ? <span className="zt-shortage-flag">⚠ Shortage</span>
                      : <span className="zt-ok-flag">✓ OK</span>
                    }
                  </td>
                  <td><span className={`zt-badge zt-badge--${r.shortage ? 'critical' : r.status}`}>{r.shortage ? '🔴' : r.status === 'critical' ? '🔴' : r.status === 'warning' ? '🟡' : '🟢'} {r.statusLabel}</span></td>
                  <td className={`zt-trend zt-trend--${r.trend}`}>{r.trend === 'up' ? '↑ up' : '↓ down'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
