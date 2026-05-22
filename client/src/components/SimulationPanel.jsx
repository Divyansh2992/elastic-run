import { useSimulation } from '../hooks/useSimulation';

function Slider({ label, id, min, max, step, value, onChange, colorClass, hint, displayValue }) {
  return (
    <div className="sim-control">
      <div className="sim-label-row">
        <span className="sim-label-text">{label}</span>
        <span className="sim-val-text">{displayValue}</span>
      </div>
      <input
        type="range" id={id}
        className={`sim-slider ${colorClass}`}
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <div className="sim-hint">{hint}</div>
    </div>
  );
}

export default function SimulationPanel() {
  const { params, result, loading, error, updateParam, simulate, reset } = useSimulation();

  return (
    <aside className="sim-card card">
      <div className="sim-card-header">
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          <span className="title-icon">🧪</span> Scenario Simulator
        </h3>
        <span className="section-badge section-badge--brand">What-if Analysis</span>
      </div>
      <div className="sim-body">

        <Slider
          label="🛍️ Festival Demand Multiplier" id="sim-demand"
          min={1.0} max={3.0} step={0.1}
          value={params.demandMultiplier}
          onChange={v => updateParam('demandMultiplier', v)}
          colorClass="sim-slider--demand"
          hint="1× = normal, 2× = Diwali/Eid, 3× = extreme peak surge"
          displayValue={`${params.demandMultiplier.toFixed(1)}×`}
        />

        <Slider
          label="🚫 Carrier Failure Rate" id="sim-carrier"
          min={0} max={50} step={1}
          value={params.carrierFailurePct}
          onChange={v => updateParam('carrierFailurePct', v)}
          colorClass="sim-slider--carrier"
          hint="Simulates % of carrier capacity going offline (BlueDart, Delhivery, Xpressbees)"
          displayValue={`${params.carrierFailurePct.toFixed(0)}% failure`}
        />

        <Slider
          label="➕ Emergency Riders Deployed" id="sim-riders"
          min={0} max={5000} step={50}
          value={params.extraRiders}
          onChange={v => updateParam('extraRiders', v)}
          colorClass="sim-slider--riders"
          hint="Add on-demand gig riders across all zones to offset shortages"
          displayValue={`+${params.extraRiders} riders`}
        />

        <div className="sim-actions">
          <button className="btn btn--primary" onClick={simulate} disabled={loading}>
            {loading ? '⏳ Running…' : '▶ Run Simulation'}
          </button>
          <button className="btn btn--ghost" onClick={reset}>↺ Reset</button>
        </div>

        {error && (
          <div style={{ padding: '10px', background: 'var(--critical-dim)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius)', color: 'var(--critical)', fontSize: '0.75rem' }}>
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="sim-result">
            <div className="sim-result-row">
              <span>Demand Increase</span>
              <span className={`sim-val ${result.demandDeltaPct > 30 ? 'txt-danger' : result.demandDeltaPct > 10 ? 'txt-warn' : 'txt-ok'}`}>
                +{result.demandDeltaPct}%
              </span>
            </div>
            <div className="sim-result-row">
              <span>Capacity Impact</span>
              <span className={`sim-val ${result.capacityLossPct > 20 ? 'txt-danger' : result.capacityLossPct > 10 ? 'txt-warn' : 'txt-ok'}`}>
                {result.capacityLossPct > 0 ? `-${result.capacityLossPct}% from failures` : 'No carrier impact'}
              </span>
            </div>
            <div className="sim-result-row">
              <span>Shortage Zones</span>
              <span className={`sim-val ${(result.kpis?.shortageZones || 0) > 3 ? 'txt-danger' : (result.kpis?.shortageZones || 0) > 0 ? 'txt-warn' : 'txt-ok'}`}>
                {result.kpis?.shortageZones || 0} zones
              </span>
            </div>
            <div className="sim-result-row">
              <span>Overloaded Zones</span>
              <span className={`sim-val ${result.overloadedCities.length > 3 ? 'txt-danger' : result.overloadedCities.length > 1 ? 'txt-warn' : 'txt-ok'}`}>
                {result.overloadedCities.length > 0 ? result.overloadedCities.slice(0, 3).join(', ') : 'None'}
              </span>
            </div>
            <div className="sim-result-row">
              <span>Extra Riders</span>
              <span className="sim-val txt-ok">+{params.extraRiders} deployed</span>
            </div>
            {result.affectedCarriers?.length > 0 && (
              <div className="sim-result-row sim-result-row--col">
                <span>Carrier Impact</span>
                <div className="sim-carrier-list">
                  {result.affectedCarriers.slice(0, 4).map((c, i) => (
                    <span key={i} className="sim-carrier-item">{c}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="sim-result-recommendation">
              <strong>💡 Recommendation:</strong> {result.recommendation}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
