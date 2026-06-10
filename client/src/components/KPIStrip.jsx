import { useRef, useEffect } from 'react';
import { useApp } from '../context/useApp';

function KpiCard({ icon, iconColor, label, value, sub, dataStatus, trend }) {
  const valRef  = useRef(null);
  const prevRef = useRef(0);

  useEffect(() => {
    if (!valRef.current || value === undefined) return;
    const target = parseFloat(String(value).replace(/,/g, '')) || 0;
    const start  = prevRef.current;
    const diff   = target - start;
    const dur    = 600;
    const t0     = performance.now();

    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (valRef.current) valRef.current.dataset.raw = (start + diff * ease).toFixed(
        typeof value === 'string' && value.includes('.') ? 1 : 0
      );
      if (p < 1) requestAnimationFrame(step);
      else prevRef.current = target;
    }
    requestAnimationFrame(step);
  }, [value]);

  return (
    <article className="kpi-card" data-status={dataStatus || ''}>
      <div className={`kpi-icon kpi-icon--${iconColor}`}>{icon}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" ref={valRef}>{value ?? '—'}</div>
        <div className="kpi-sub">{sub}</div>
      </div>
      {trend && (
        <div className={`kpi-trend kpi-trend--${trend}`}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      )}
    </article>
  );
}

export default function KPIStrip() {
  const { state } = useApp();
  const k = state.kpis;

  if (!k || !Object.keys(k).length) return (
    <div className="kpi-grid">
      {Array.from({length:12}).map((_, i) => (
        <div key={i} className="kpi-card skeleton" />
      ))}
    </div>
  );

  const pct  = v => `${(v * 100).toFixed(1)}%`;
  const num  = v => v?.toLocaleString() ?? '—';

  const delayStatus   = k.delayRate        > 0.12 ? 'critical' : k.delayRate    > 0.07 ? 'warning' : 'ok';
  const hubStatus     = k.hubUtilization   > 0.85 ? 'critical' : k.hubUtilization > 0.65 ? 'warning' : 'ok';
  const successStatus = k.successRate      < 0.85 ? 'critical' : k.successRate   < 0.92 ? 'warning' : 'ok';
  const slaStatus     = k.slaCompliance    < 0.80 ? 'critical' : k.slaCompliance < 0.90 ? 'warning' : 'ok';
  const shortageStatus = (k.shortageZones || 0) > 3 ? 'critical' : (k.shortageZones || 0) > 1 ? 'warning' : 'ok';
  const overloadStatus = (k.overloadedZones || 0) > 3 ? 'critical' : (k.overloadedZones || 0) > 1 ? 'warning' : 'ok';

  return (
    <div className="kpi-grid kpi-grid--wide" role="list">
      {/* Row 1 — Core Capacity */}
      <KpiCard icon="📦" iconColor="blue"   label="Total Delivery Capacity"  value={num(k.totalCapacity)}          sub="Pan-India slots" />
      <KpiCard icon="🛵" iconColor="green"  label="Active Riders"            value={num(k.activeRiders)}           sub="Currently on-duty" />
      <KpiCard icon="🚐" iconColor="teal"   label="Active Vehicles"          value={num(k.activeVehicles)}         sub="Fleet in operation" />
      <KpiCard icon="⏳" iconColor="amber"  label="Pending Orders"           value={num(k.pendingOrders)}          sub="Awaiting dispatch" />
      <KpiCard icon="✅" iconColor="green"  label="Completed Today"          value={num(k.completedToday)}         sub="Deliveries fulfilled" />
      <KpiCard icon="🔄" iconColor="red"    label="Pending Retries"          value={num(k.totalPendingRetries)}    sub="Failed re-attempts" dataStatus={k.totalPendingRetries > 500 ? 'warning' : 'ok'} />

      {/* Row 2 — Health & Risk */}
      <KpiCard icon="🎯" iconColor="blue"   label="Delivery Success Rate"    value={pct(k.successRate)}            sub="Successful deliveries" dataStatus={successStatus} />
      <KpiCard icon="⚠️" iconColor="red"    label="Delay Rate"               value={pct(k.delayRate)}              sub="SLA breaches"          dataStatus={delayStatus} />
      <KpiCard icon="🏭" iconColor="purple" label="Hub Utilization"          value={pct(k.hubUtilization)}         sub="Warehouse space used"  dataStatus={hubStatus} />
      <KpiCard icon="📋" iconColor="blue"   label="SLA Compliance"           value={pct(k.slaCompliance)}          sub="On-time vs promised"   dataStatus={slaStatus} />
      <KpiCard icon="🔴" iconColor="red"    label="Shortage Zones"           value={num(k.shortageZones || 0)}     sub="Demand > Capacity"     dataStatus={shortageStatus} />
      <KpiCard icon="🏙️" iconColor="amber"  label="Overloaded Zones"        value={num(k.overloadedZones || 0)}   sub="> 85% utilization"      dataStatus={overloadStatus} />
    </div>
  );
}
