import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';

// ── India bounding box ────────────────────────────
// Southwest: 6.4°N, 68.1°E  |  Northeast: 35.7°N, 97.4°E
const INDIA_BOUNDS = [[6.4, 68.1], [35.7, 97.4]];
const INDIA_CENTER = [22.5, 82.0];
const INDIA_ZOOM   = 5;
const MIN_ZOOM     = 4;
const MAX_ZOOM     = 9;

// ── Reset view to India on demand ────────────────
function ResetViewControl({ onReset }) {
  return (
    <button className="map-reset-btn" onClick={onReset} title="Reset to India view">
      🇮🇳 Reset View
    </button>
  );
}

// ── Auto-fit India on mount ───────────────────────
function FitIndia() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [20, 20], maxZoom: INDIA_ZOOM });
  }, [map]);
  return null;
}

// ── Heatmap layer using leaflet.heat ─────────────
function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L?.heatLayer) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    layerRef.current = window.L.heatLayer(points, {
      radius: 50, blur: 35,
      gradient: { 0.0: '#10b981', 0.4: '#f59e0b', 0.7: '#ef4444', 1.0: '#dc2626' },
    });
    layerRef.current.addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [map, points]);

  return null;
}

function getStatusColor(utilization, shortage) {
  if (shortage)            return { fill: '#dc2626', stroke: '#f43f5e' };
  if (utilization >= 0.85) return { fill: '#f43f5e', stroke: '#fb7185' };
  if (utilization >= 0.65) return { fill: '#f59e0b', stroke: '#fbbf24' };
  return { fill: '#10b981', stroke: '#34d399' };
}

function getStatusLabel(u, shortage) {
  if (shortage)  return 'Shortage';
  if (u >= 0.85) return 'Overloaded';
  if (u >= 0.65) return 'Medium Load';
  return 'Healthy';
}

const VIEW_MODES = [
  { key: 'demand',   label: '📦 Demand',   desc: 'Delivery capacity utilization by zone' },
  { key: 'riders',   label: '🛵 Riders',   desc: 'Rider availability (red = shortage)' },
  { key: 'hub',      label: '🏭 Hub',      desc: 'Warehouse / hub space utilization' },
  { key: 'shortage', label: '🔴 Shortage', desc: 'Zones where demand exceeds capacity' },
];

// ── Map inner component (needs map context) ───────
function MapInner({ heatPoints, cities, onResetView }) {
  const map = useMap();

  const handleReset = () => {
    map.fitBounds(INDIA_BOUNDS, { padding: [20, 20], maxZoom: INDIA_ZOOM, animate: true, duration: 0.8 });
  };

  return (
    <>
      <FitIndia />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={18}
      />
      <HeatLayer points={heatPoints} />
      {cities.map(city => {
        const { fill, stroke } = getStatusColor(city.utilization, city.shortage);
        const demand  = (city.pending || 0) + (city.completed || 0);
        const deficit = demand - city.capacity;
        const carrierIssues = (city.carriers || []).filter(cr => cr.status !== 'active');
        const statusKey = city.shortage ? 'shortage' : city.utilization >= 0.85 ? 'critical' : city.utilization >= 0.65 ? 'warning' : 'ok';

        return (
          <CircleMarker
            key={city.id}
            center={[city.lat, city.lng]}
            radius={city.shortage ? 13 : 9}
            pathOptions={{ color: stroke, fillColor: fill, fillOpacity: 0.92, weight: city.shortage ? 3 : 2 }}
          >
            <Popup className="logi-popup" maxWidth={260}>
              <div className="map-popup">
                {/* Header */}
                <div className="mp-header">
                  <div>
                    <div className="mp-city">{city.name}</div>
                    <div className="mp-region">{city.region} Region</div>
                  </div>
                  <span className={`mp-badge mp-badge--${statusKey}`}>
                    {statusKey === 'shortage' ? '🔴' : statusKey === 'critical' ? '🔴' : statusKey === 'warning' ? '🟡' : '🟢'}
                    {' '}{getStatusLabel(city.utilization, city.shortage)}
                  </span>
                </div>

                {/* Shortage alert */}
                {city.shortage && (
                  <div className="mp-shortage-alert">
                    🔴 Demand exceeds capacity by <strong>{deficit.toLocaleString()}</strong> slots
                  </div>
                )}

                {/* Capacity bar */}
                <div className="mp-cap-section">
                  <div className="mp-cap-row">
                    <span className="mp-cap-label">Capacity Used</span>
                    <span className="mp-cap-pct" style={{ color: city.utilization >= 0.85 ? '#f43f5e' : city.utilization >= 0.65 ? '#f59e0b' : '#10b981' }}>
                      {(city.utilization * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mp-bar">
                    <div
                      className={`mp-bar-fill mp-bar-fill--${city.shortage ? 'critical' : statusKey === 'critical' ? 'critical' : statusKey === 'warning' ? 'warning' : 'ok'}`}
                      style={{ width: `${Math.min(city.utilization * 100, 100).toFixed(0)}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="mp-grid">
                  <div className="mp-stat"><span className="mp-label">Riders</span><span className="mp-val">{city.riders?.toLocaleString()}</span></div>
                  <div className="mp-stat"><span className="mp-label">Vehicles</span><span className="mp-val">{city.vehicles}</span></div>
                  <div className="mp-stat"><span className="mp-label">Success</span><span className="mp-val">{(city.successRate * 100).toFixed(1)}%</span></div>
                  <div className="mp-stat"><span className="mp-label">Delay</span><span className={`mp-val ${city.delayRate > 0.12 ? 'mp-val--warn' : ''}`}>{(city.delayRate * 100).toFixed(1)}%</span></div>
                  <div className="mp-stat"><span className="mp-label">SLA</span><span className={`mp-val ${city.slaCompliance < 0.80 ? 'mp-val--warn' : ''}`}>{(city.slaCompliance * 100).toFixed(1)}%</span></div>
                  <div className="mp-stat"><span className="mp-label">Hub Fill</span><span className="mp-val">{(city.hubUtil * 100).toFixed(1)}%</span></div>
                  <div className="mp-stat"><span className="mp-label">Pending</span><span className="mp-val">{city.pending?.toLocaleString()}</span></div>
                  <div className="mp-stat"><span className="mp-label">Retries</span><span className={`mp-val ${(city.pendingRetries||0) > 100 ? 'mp-val--warn' : ''}`}>{(city.pendingRetries||0).toLocaleString()}</span></div>
                </div>

                {/* Fleet types */}
                {city.fleetTypes && (
                  <div className="mp-fleet-row">
                    <span className="mp-fleet-item">🛵 {city.fleetTypes.bikes} bikes</span>
                    <span className="mp-fleet-item">🚐 {city.fleetTypes.vans} vans</span>
                    <span className="mp-fleet-item">🚛 {city.fleetTypes.trucks} trucks</span>
                  </div>
                )}

                {/* Carrier issues */}
                {carrierIssues.length > 0 && (
                  <div className="mp-carrier-issues">
                    <div className="mp-carrier-title">⚠ Carrier Issues</div>
                    {carrierIssues.map(cr => (
                      <span key={cr.name} className={`mp-carrier-badge mp-carrier-badge--${cr.status}`}>
                        {cr.status === 'offline' ? '🔴' : '🟡'} {cr.name}: {cr.status}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function MapHeatmap() {
  const { state } = useApp();
  const [viewMode, setViewMode] = useState('demand');
  const mapRef = useRef(null);

  const heatPoints = state.cities.map(c => {
    let intensity;
    if      (viewMode === 'demand')   intensity = c.utilization;
    else if (viewMode === 'riders')   intensity = 1 - (c.riders / 1200);
    else if (viewMode === 'hub')      intensity = c.hubUtil;
    else /* shortage */               intensity = c.shortage ? 1.0 : c.utilization * 0.5;
    return [c.lat, c.lng, Math.max(0, Math.min(1, intensity))];
  });

  const critCount     = state.cities.filter(c => c.utilization >= 0.85).length;
  const warnCount     = state.cities.filter(c => c.utilization >= 0.65 && c.utilization < 0.85).length;
  const shortageCount = state.cities.filter(c => c.shortage).length;
  const healthyCount  = state.cities.filter(c => c.utilization < 0.65 && !c.shortage).length;

  const activeMode = VIEW_MODES.find(v => v.key === viewMode);

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.fitBounds(INDIA_BOUNDS, { padding: [20, 20], maxZoom: INDIA_ZOOM, animate: true, duration: 0.8 });
    }
  };

  return (
    <div className="map-section">
      <div className="map-card card">

        {/* Header toolbar */}
        <div className="map-card-header">
          <div className="map-header-left">
            <span className="map-view-label">📍 India — {state.cities.length} Cities</span>
            <span className="map-mode-desc">{activeMode?.desc}</span>
          </div>
          <div className="map-header-right">
            <div className="map-view-btns">
              {VIEW_MODES.map(v => (
                <button
                  key={v.key}
                  className={`map-view-btn ${viewMode === v.key ? 'active' : ''} ${v.key === 'shortage' ? 'map-view-btn--shortage' : ''}`}
                  onClick={() => setViewMode(v.key)}
                  title={v.desc}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button className="map-reset-btn" onClick={handleResetView} title="Fit India in view">
              ⊙ Reset
            </button>
          </div>
        </div>

        {/* Zone count strip */}
        <div className="map-zone-strip">
          <div className="map-zone-chip map-zone-chip--ok">
            <span className="mzc-dot mzc-dot--ok" /> {healthyCount} Healthy
          </div>
          <div className="map-zone-chip map-zone-chip--warn">
            <span className="mzc-dot mzc-dot--warn" /> {warnCount} Medium Load
          </div>
          <div className="map-zone-chip map-zone-chip--critical">
            <span className="mzc-dot mzc-dot--critical" /> {critCount} Overloaded
          </div>
          {shortageCount > 0 && (
            <div className="map-zone-chip map-zone-chip--shortage">
              <span className="mzc-dot mzc-dot--shortage" /> {shortageCount} Shortage
            </div>
          )}
          <div className="map-zone-chip map-zone-chip--total">
            🇮🇳 Pan-India View
          </div>
        </div>

        {/* Map */}
        <MapContainer
          ref={mapRef}
          center={INDIA_CENTER}
          zoom={INDIA_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: '500px', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
          scrollWheelZoom={true}
        >
          <MapInner
            heatPoints={heatPoints}
            cities={state.cities}
            onResetView={handleResetView}
          />
        </MapContainer>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-item"><div className="legend-dot legend-dot--ok" /> Healthy (&lt;65%)</div>
          <div className="legend-item"><div className="legend-dot legend-dot--warning" /> Medium Load (65–85%)</div>
          <div className="legend-item"><div className="legend-dot legend-dot--critical" /> Overloaded (&gt;85%)</div>
          <div className="legend-item"><div className="legend-dot legend-dot--shortage" /> Shortage (Demand &gt; Capacity)</div>
          <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            🖱 Scroll to zoom · Click city for details
          </div>
        </div>
      </div>

      {/* Side alerts panel */}
      <div className="map-side-panel">
        <div className="alert-summary-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <h3 style={{ fontSize:'0.82rem', fontWeight:700 }}>🔔 Live Alerts</h3>
            <span className="section-badge section-badge--live">● Live</span>
          </div>
          <div className="alert-count-row">
            <div className="alert-count-item alert-count-item--critical">
              <span className="alert-count-num alert-count-num--critical">
                {state.alerts.filter(a => a.type === 'critical').length}
              </span>
              <span className="alert-count-lbl">Critical</span>
            </div>
            <div className="alert-count-item alert-count-item--warning">
              <span className="alert-count-num alert-count-num--warning">
                {state.alerts.filter(a => a.type === 'warning').length}
              </span>
              <span className="alert-count-lbl">Warnings</span>
            </div>
            {shortageCount > 0 && (
              <div className="alert-count-item alert-count-item--shortage">
                <span className="alert-count-num alert-count-num--critical">{shortageCount}</span>
                <span className="alert-count-lbl">Shortages</span>
              </div>
            )}
          </div>
          <div className="alert-feed" role="log" aria-live="polite">
            {state.alerts.slice(0, 15).map((a, i) => (
              <div key={a._id || i} className={`alert-item alert-item--${a.type}`}>
                <span className="alert-icon">{a.icon}</span>
                <div className="alert-body">
                  <span className="alert-msg">{a.msg}</span>
                  <span className="alert-time">
                    {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
