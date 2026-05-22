import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ExplainerModal from './ExplainerModal';

export default function Header() {
  const { state } = useApp();
  const [clock, setClock] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const tick = () => setClock(
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST'
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hasCritical   = state.alerts.slice(0, 5).some(a => a.type === 'critical');
  const shortageCount = state.cities.filter(c => c.shortage).length;

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">🚚</div>
            <div>
              <div className="logo-text">LogiSense</div>
              <div className="logo-sub">Logistics Intelligence</div>
            </div>
          </div>
          <div className="header-divider" />
          <span className="header-subtitle">Real-Time Capacity Dashboard — Pan India Operations</span>
        </div>
        <div className="header-right">
          {shortageCount > 0 && (
            <span className="shortage-header-badge" title={`${shortageCount} zones have demand exceeding capacity`}>
              🔴 {shortageCount} Shortage Zone{shortageCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="live-dot">LIVE</span>
          <span className={`status-badge ${hasCritical ? 'status-badge--alert' : 'status-badge--ok'}`}>
            {hasCritical ? '⚠ Alert' : '✓ Healthy'}
          </span>
          <span className={`socket-badge ${state.connected ? 'socket-badge--on' : 'socket-badge--off'}`}>
            {state.connected ? '⚡ Connected' : '○ Reconnecting…'}
          </span>
          <div className="clock-wrap">
            <span className="live-clock">{clock}</span>
            <span className="last-updated">
              {state.lastUpdate ? `Updated ${state.lastUpdate.toLocaleTimeString('en-IN')}` : 'Loading…'}
            </span>
          </div>
          <button
            className="explainer-btn"
            onClick={() => setShowModal(true)}
            title="About this dashboard — What, Why & How"
            aria-label="Open dashboard explainer"
          >
            ℹ About
          </button>
        </div>
      </header>
      {showModal && <ExplainerModal onClose={() => setShowModal(false)} />}
    </>
  );
}
