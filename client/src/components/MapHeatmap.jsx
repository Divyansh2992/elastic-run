import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup,
  useMap, useMapEvents, Tooltip
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchCapacity, fetchCapacitySummary } from '../services/api';

// ── India bounding box ────────────────────────────────
const INDIA_BOUNDS  = [[6.4, 68.1], [35.7, 97.4]];
const INDIA_CENTER  = [22.5, 82.0];
const INDIA_ZOOM    = 5;
const MIN_ZOOM      = 4;
const MAX_ZOOM      = 14;

// Zoom thresholds for drill-down
// zoom < 6  → show states
// zoom 6-7  → show cities
// zoom > 7  → show stations
const ZOOM_CITIES   = 6;
const ZOOM_STATIONS = 8;

// ── Color helpers (matching sheet color coding) ───────
// Gap-based: Red = high gap (critical), Amber = moderate, Blue = low, Green = minimal
function gapColor(gap, maxGap) {
  if (gap <= 0)             return { fill: '#10b981', stroke: '#34d399', label: 'No Gap',    emoji: '🟢' };
  const ratio = gap / Math.max(1, maxGap);
  if (ratio >= 0.6 || gap >= 2000) return { fill: '#dc2626', stroke: '#f87171', label: 'Critical', emoji: '🔴' };
  if (ratio >= 0.3 || gap >= 800)  return { fill: '#f59e0b', stroke: '#fbbf24', label: 'High',     emoji: '🟡' };
  if (ratio >= 0.1 || gap >= 200)  return { fill: '#3b82f6', stroke: '#60a5fa', label: 'Moderate', emoji: '🔵' };
  return                           { fill: '#10b981', stroke: '#34d399', label: 'Low',       emoji: '🟢' };
}

// ── Auto-fit India on mount ────────────────────────────
function FitIndia() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [20, 20], maxZoom: INDIA_ZOOM });
  }, [map]);
  return null;
}

// ── Zoom watcher ───────────────────────────────────────
function ZoomWatcher({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
    moveend: (e) => onZoomChange(e.target.getZoom()),
  });
  return null;
}

// ── State markers (low zoom) ───────────────────────────
function StateMarkers({ states, maxGap, onStateClick }) {
  return states.map(s => {
    const { fill, stroke } = gapColor(s.total_gap, maxGap);
    const r = Math.max(10, Math.min(28, 10 + (s.total_gap / maxGap) * 18));
    return (
      <CircleMarker
        key={s.state}
        center={[s.lat, s.lng]}
        radius={r}
        pathOptions={{ color: stroke, fillColor: fill, fillOpacity: 0.85, weight: 2 }}
        eventHandlers={{ click: () => onStateClick(s) }}
      >
        <Tooltip permanent={false} direction="top" className="logi-tooltip">
          <strong>{s.state}</strong><br />
          Gap: <b style={{color: fill}}>{s.total_gap.toLocaleString()}</b> headcount<br />
          {s.station_count} stations · {s.city_count} cities
        </Tooltip>
        <Popup className="logi-popup" maxWidth={280}>
          <div className="map-popup">
            <div className="mp-header">
              <div>
                <div className="mp-city">{s.state}</div>
                <div className="mp-region">{s.station_count} stations · {s.city_count} cities</div>
              </div>
              <span className={`mp-badge mp-badge--${s.total_gap >= 2000 ? 'shortage' : s.total_gap >= 800 ? 'critical' : 'ok'}`}>
                {gapColor(s.total_gap, maxGap).emoji} {gapColor(s.total_gap, maxGap).label}
              </span>
            </div>
            <div className="mp-cap-section">
              <div className="mp-cap-row">
                <span className="mp-cap-label">Total Gap (To Be Hired)</span>
                <span className="mp-cap-pct" style={{color: fill}}>{s.total_gap.toLocaleString()}</span>
              </div>
              <div className="mp-cap-row">
                <span className="mp-cap-label">Daily Load</span>
                <span className="mp-val">{s.daily_load.toLocaleString()}</span>
              </div>
            </div>
            <div className="mp-grid">
              <div className="mp-stat"><span className="mp-label">Stations</span><span className="mp-val">{s.station_count}</span></div>
              <div className="mp-stat"><span className="mp-label">Cities</span><span className="mp-val">{s.city_count}</span></div>
            </div>
            <div className="mp-fleet-row" style={{marginTop: 8, fontSize: '0.68rem', color: 'var(--text-muted)'}}>
              🔍 Zoom in to see city breakdown
            </div>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

// ── City markers (mid zoom) ────────────────────────────
function CityMarkers({ states, maxCityGap, onCityClick }) {
  const cities = states.flatMap(s =>
    s.cities.map(c => ({ ...c, state: s.state }))
  );
  return cities.map(c => {
    const { fill, stroke } = gapColor(c.total_gap, maxCityGap);
    const r = Math.max(7, Math.min(18, 7 + (c.total_gap / Math.max(1, maxCityGap)) * 11));
    const key = `${c.state}-${c.city}`;
    return (
      <CircleMarker
        key={key}
        center={[c.lat, c.lng]}
        radius={r}
        pathOptions={{ color: stroke, fillColor: fill, fillOpacity: 0.88, weight: 2 }}
        eventHandlers={{ click: () => onCityClick(c) }}
      >
        <Tooltip permanent={false} direction="top" className="logi-tooltip">
          <strong>{c.city}</strong><br />
          {c.state}<br />
          Gap: <b style={{color: fill}}>{c.total_gap.toLocaleString()}</b> · {c.station_count} stn
        </Tooltip>
        <Popup className="logi-popup" maxWidth={280}>
          <div className="map-popup">
            <div className="mp-header">
              <div>
                <div className="mp-city">{c.city}</div>
                <div className="mp-region">{c.state}</div>
              </div>
              <span className={`mp-badge mp-badge--${c.total_gap >= 500 ? 'shortage' : c.total_gap >= 200 ? 'critical' : 'ok'}`}>
                {gapColor(c.total_gap, maxCityGap).emoji} {gapColor(c.total_gap, maxCityGap).label}
              </span>
            </div>
            <div className="mp-cap-section">
              <div className="mp-cap-row">
                <span className="mp-cap-label">Gap (To Be Hired)</span>
                <span className="mp-cap-pct" style={{color: fill}}>{c.total_gap.toLocaleString()}</span>
              </div>
              <div className="mp-cap-row">
                <span className="mp-cap-label">Daily Load</span>
                <span className="mp-val">{c.daily_load.toLocaleString()}</span>
              </div>
            </div>
            <div className="mp-grid">
              <div className="mp-stat"><span className="mp-label">Stations</span><span className="mp-val">{c.station_count}</span></div>
              <div className="mp-stat"><span className="mp-label">State</span><span className="mp-val" style={{fontSize:'0.65rem'}}>{c.state}</span></div>
            </div>
            <div className="mp-fleet-row" style={{marginTop: 8, fontSize: '0.68rem', color: 'var(--text-muted)'}}>
              🔍 Zoom in to see station breakdown
            </div>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

// ── Station markers (high zoom) ────────────────────────
function StationMarkers({ states, maxStationGap }) {
  const stations = states.flatMap(s =>
    s.cities.flatMap(c =>
      c.stations.map(st => ({ ...st, city: c.city, state: s.state }))
    )
  );

  return stations.map((st, i) => {
    const { fill, stroke } = gapColor(st.total_gap, maxStationGap);
    const r = Math.max(5, Math.min(12, 5 + (st.total_gap / Math.max(1, maxStationGap)) * 7));
    const key = `stn-${i}-${st.station}`;

    // Build gap detail rows
    const gapEntries = Object.entries(st.gap_details || {}).filter(([, v]) => v > 0);

    return (
      <CircleMarker
        key={key}
        center={[st.lat, st.lng]}
        radius={r}
        pathOptions={{ color: stroke, fillColor: fill, fillOpacity: 0.90, weight: 1.5 }}
      >
        <Tooltip permanent={false} direction="top" className="logi-tooltip">
          <strong>{st.station || st.city}</strong><br />
          Gap: <b style={{color: fill}}>{st.total_gap}</b> · {st.business}
        </Tooltip>
        <Popup className="logi-popup" maxWidth={300}>
          <div className="map-popup">
            <div className="mp-header">
              <div>
                <div className="mp-city" style={{fontSize:'0.78rem'}}>{st.station || st.city}</div>
                <div className="mp-region">{st.city} · {st.state}</div>
              </div>
              <span className={`mp-badge mp-badge--${st.total_gap >= 100 ? 'shortage' : st.total_gap >= 30 ? 'critical' : 'ok'}`}>
                {gapColor(st.total_gap, maxStationGap).emoji} {gapColor(st.total_gap, maxStationGap).label}
              </span>
            </div>

            <div className="mp-cap-section">
              <div className="mp-cap-row">
                <span className="mp-cap-label">Business</span>
                <span className="mp-val">{st.business}</span>
              </div>
              <div className="mp-cap-row">
                <span className="mp-cap-label">Daily Load</span>
                <span className="mp-val">{(st.daily_load || 0).toLocaleString()}</span>
              </div>
              <div className="mp-cap-row">
                <span className="mp-cap-label">Total Gap</span>
                <span className="mp-cap-pct" style={{color: fill}}>{st.total_gap}</span>
              </div>
              {st.pincode && (
                <div className="mp-cap-row">
                  <span className="mp-cap-label">Pincode</span>
                  <span className="mp-val">{st.pincode}</span>
                </div>
              )}
            </div>

            {gapEntries.length > 0 && (
              <div className="mp-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '4px 8px'}}>
                {gapEntries.map(([role, cnt]) => (
                  <div key={role} className="mp-stat">
                    <span className="mp-label" style={{fontSize:'0.6rem'}}>{role}</span>
                    <span className="mp-val" style={{color: fill}}>{cnt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

// ── Summary panel row ────────────────────────────────
function SummaryRow({ biz }) {
  const gapColor = biz.gap >= 5000 ? '#dc2626' : biz.gap >= 2000 ? '#f59e0b' : biz.gap >= 500 ? '#3b82f6' : '#10b981';
  return (
    <div className="cap-biz-row">
      <span className="cap-biz-name">{biz.name}</span>
      <span className="cap-biz-stn">{biz.stations} stn</span>
      <span className="cap-biz-gap" style={{ color: gapColor }}>
        {biz.gap > 0 ? `+${biz.gap.toLocaleString()}` : biz.gap === 0 ? '—' : biz.gap.toLocaleString()}
      </span>
      <span className="cap-biz-atr">{biz.attrn_pct}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────
export default function MapHeatmap() {
  const [capacityData, setCapacityData] = useState([]);
  const [summaryData, setSummaryData]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [zoomLevel, setZoomLevel]       = useState(INDIA_ZOOM);
  const [drillState, setDrillState]     = useState(null); // focused state for mid-zoom
  const [drillCity, setDrillCity]       = useState(null);  // focused city for high-zoom
  const mapRef = useRef(null);

  // Load data
  useEffect(() => {
    Promise.all([fetchCapacity(), fetchCapacitySummary()])
      .then(([states, summary]) => {
        setCapacityData(states);
        setSummaryData(summary.summary || summary);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load capacity data:', err);
        setLoading(false);
      });
  }, []);

  // Compute max gaps for color scaling
  const maxStateGap  = Math.max(1, ...capacityData.map(s => s.total_gap));
  const maxCityGap   = Math.max(1, ...capacityData.flatMap(s => s.cities.map(c => c.total_gap)));
  const maxStationGap= Math.max(1, ...capacityData.flatMap(s => s.cities.flatMap(c => c.stations.map(st => st.total_gap))));

  const totalGap  = capacityData.reduce((a, s) => a + s.total_gap, 0);
  const critCount = capacityData.filter(s => s.total_gap >= 2000).length;
  const highCount = capacityData.filter(s => s.total_gap >= 800 && s.total_gap < 2000).length;
  const modCount  = capacityData.filter(s => s.total_gap >= 200 && s.total_gap < 800).length;
  const lowCount  = capacityData.filter(s => s.total_gap < 200).length;

  // Decide what to show based on zoom
  const displayMode = zoomLevel < ZOOM_CITIES ? 'states' : zoomLevel < ZOOM_STATIONS ? 'cities' : 'stations';

  // Active data to render
  const activeStates = drillState
    ? capacityData.filter(s => s.state === drillState)
    : capacityData;

  const handleStateClick = useCallback((s) => {
    setDrillState(s.state);
    if (mapRef.current) {
      // Zoom into the state
      const padding = 40;
      mapRef.current.setView([s.lat, s.lng], ZOOM_CITIES + 0.5, { animate: true, duration: 0.6 });
    }
  }, []);

  const handleCityClick = useCallback((c) => {
    setDrillCity(c.city);
    if (mapRef.current) {
      mapRef.current.setView([c.lat, c.lng], ZOOM_STATIONS + 1, { animate: true, duration: 0.6 });
    }
  }, []);

  const handleResetView = () => {
    setDrillState(null);
    setDrillCity(null);
    if (mapRef.current) {
      mapRef.current.fitBounds(INDIA_BOUNDS, { padding: [20, 20], maxZoom: INDIA_ZOOM, animate: true, duration: 0.8 });
    }
  };

  const zoomModeLabel = displayMode === 'states'
    ? `🇮🇳 India · ${capacityData.length} States`
    : displayMode === 'cities'
    ? `📍 City view · ${activeStates.flatMap(s => s.cities).length} cities`
    : `🏢 Station view`;

  return (
    <div className="map-section">
      <div className="map-card card">

        {/* Header toolbar */}
        <div className="map-card-header">
          <div className="map-header-left">
            <span className="map-view-label">{zoomModeLabel}</span>
            <span className="map-mode-desc">
              {displayMode === 'states' ? 'Capacity gap by state · zoom in to drill down'
               : displayMode === 'cities' ? 'City-level gap · zoom in for station detail'
               : 'Station-level gap breakdown'}
            </span>
          </div>
          <div className="map-header-right">
            {drillState && (
              <span className="map-drill-crumb">
                🇮🇳 India &rsaquo; <strong>{drillState}</strong>
                {drillCity && <> &rsaquo; <strong>{drillCity}</strong></>}
              </span>
            )}
            <button className="map-reset-btn" onClick={handleResetView} title="Back to India view">
              ⊙ Reset
            </button>
          </div>
        </div>

        {/* Zone count strip */}
        <div className="map-zone-strip">
          <div className="map-zone-chip map-zone-chip--shortage">
            <span className="mzc-dot mzc-dot--shortage" /> {critCount} Critical (&gt;2000 gap)
          </div>
          <div className="map-zone-chip map-zone-chip--critical">
            <span className="mzc-dot mzc-dot--critical" /> {highCount} High (800–2000)
          </div>
          <div className="map-zone-chip map-zone-chip--warn">
            <span className="mzc-dot" style={{background:'#3b82f6', width:8, height:8, borderRadius:'50%', display:'inline-block', marginRight:4}} />
            {modCount} Moderate (200–800)
          </div>
          <div className="map-zone-chip map-zone-chip--ok">
            <span className="mzc-dot mzc-dot--ok" /> {lowCount} Low (&lt;200)
          </div>
          <div className="map-zone-chip map-zone-chip--total">
            📋 Total Gap: <strong style={{color:'#f59e0b', marginLeft:4}}>{totalGap.toLocaleString()}</strong>
          </div>
        </div>

        {/* Map */}
        <div style={{ position: 'relative' }}>
          {loading && (
            <div style={{
              position:'absolute', inset:0, zIndex:1000, display:'flex',
              alignItems:'center', justifyContent:'center',
              background:'rgba(0,0,0,0.5)', borderRadius:8
            }}>
              <div style={{color:'#fff', fontSize:'1rem'}}>⏳ Loading capacity data…</div>
            </div>
          )}
          <MapContainer
            ref={mapRef}
            center={INDIA_CENTER}
            zoom={INDIA_ZOOM}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            maxBounds={INDIA_BOUNDS}
            maxBoundsViscosity={0.8}
            style={{ height: '500px', width: '100%' }}
            zoomControl={true}
            attributionControl={false}
            scrollWheelZoom={true}
          >
            <FitIndia />
            <ZoomWatcher onZoomChange={setZoomLevel} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={18}
            />

            {/* Render based on zoom level */}
            {!loading && displayMode === 'states' && (
              <StateMarkers
                states={capacityData}
                maxGap={maxStateGap}
                onStateClick={handleStateClick}
              />
            )}
            {!loading && displayMode === 'cities' && (
              <CityMarkers
                states={activeStates}
                maxCityGap={maxCityGap}
                onCityClick={handleCityClick}
              />
            )}
            {!loading && displayMode === 'stations' && (
              <StationMarkers
                states={activeStates}
                maxStationGap={maxStationGap}
              />
            )}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-item"><div className="legend-dot" style={{background:'#dc2626'}} /> Critical Gap (&gt;2000)</div>
          <div className="legend-item"><div className="legend-dot" style={{background:'#f59e0b'}} /> High Gap (800–2000)</div>
          <div className="legend-item"><div className="legend-dot" style={{background:'#3b82f6'}} /> Moderate (200–800)</div>
          <div className="legend-item"><div className="legend-dot" style={{background:'#10b981'}} /> Low Gap (&lt;200)</div>
          <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            🖱 Scroll/Zoom to drill down · Click for details
          </div>
        </div>
      </div>

      {/* Side panel — Summary from sheet */}
      <div className="map-side-panel">
        <div className="alert-summary-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <h3 style={{ fontSize:'0.82rem', fontWeight:700 }}>📊 Capacity Summary</h3>
            <span className="section-badge section-badge--live">May 2026</span>
          </div>

          {summaryData && (
            <>
              {/* Top KPIs */}
              <div className="alert-count-row" style={{marginBottom:12}}>
                <div className="alert-count-item alert-count-item--critical">
                  <span className="alert-count-num alert-count-num--critical">{summaryData.total_stations || 930}</span>
                  <span className="alert-count-lbl">Stations</span>
                </div>
                <div className="alert-count-item alert-count-item--warning">
                  <span className="alert-count-num alert-count-num--warning">{(summaryData.attrition || 0).toLocaleString()}</span>
                  <span className="alert-count-lbl">Attrition</span>
                </div>
                <div className="alert-count-item alert-count-item--shortage">
                  <span className="alert-count-num alert-count-num--critical">{totalGap.toLocaleString()}</span>
                  <span className="alert-count-lbl">Total Gap</span>
                </div>
              </div>

              {/* HC Overview */}
              <div style={{marginBottom:10, padding:'8px', background:'rgba(255,255,255,0.05)', borderRadius:6}}>
                <div style={{fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, fontWeight:600, letterSpacing:'0.05em'}}>HEADCOUNT OVERVIEW</div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:4}}>
                  <span style={{color:'var(--text-muted)'}}>Opening (Mar)</span>
                  <span style={{fontWeight:700}}>{(summaryData.opening_hc || 4987).toLocaleString()}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:4}}>
                  <span style={{color:'var(--text-muted)'}}>Closing (Apr)</span>
                  <span style={{fontWeight:700}}>{(summaryData.closing_hc || 5169).toLocaleString()}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:4}}>
                  <span style={{color:'var(--text-muted)'}}>Hired</span>
                  <span style={{fontWeight:700, color:'#10b981'}}>+{(summaryData.hired || 689).toLocaleString()}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.72rem'}}>
                  <span style={{color:'var(--text-muted)'}}>Net Change</span>
                  <span style={{fontWeight:700, color: (summaryData.net_change || -127) < 0 ? '#f43f5e' : '#10b981'}}>
                    {(summaryData.net_change || -127) > 0 ? '+' : ''}{(summaryData.net_change || -127).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Business breakdown */}
              <div style={{fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, fontWeight:600, letterSpacing:'0.05em'}}>BUSINESS BREAKDOWN</div>
              <div className="cap-biz-header">
                <span className="cap-biz-name">Business</span>
                <span className="cap-biz-stn">Stns</span>
                <span className="cap-biz-gap">Gap</span>
                <span className="cap-biz-atr">Attrn%</span>
              </div>
              {(summaryData.businesses || []).map(biz => (
                <SummaryRow key={biz.name} biz={biz} />
              ))}
            </>
          )}

          {/* Top states by gap */}
          {capacityData.length > 0 && (
            <>
              <div style={{fontSize:'0.65rem', color:'var(--text-muted)', margin:'10px 0 6px', fontWeight:600, letterSpacing:'0.05em'}}>TOP STATES BY GAP</div>
              {capacityData.slice(0, 6).map(s => {
                const { fill } = gapColor(s.total_gap, maxStateGap);
                return (
                  <div key={s.state} className="cap-state-row" onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setView([s.lat, s.lng], ZOOM_CITIES, { animate: true });
                      setDrillState(s.state);
                    }
                  }}>
                    <span className="cap-state-dot" style={{ background: fill }} />
                    <span className="cap-state-name">{s.state}</span>
                    <span className="cap-state-gap" style={{ color: fill }}>{s.total_gap.toLocaleString()}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
