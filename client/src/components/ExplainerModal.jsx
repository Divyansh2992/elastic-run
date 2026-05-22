import { useEffect } from 'react';

export default function ExplainerModal({ onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="explainer-overlay" role="dialog" aria-modal="true" aria-labelledby="explainer-title" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="explainer-modal">
        <div className="explainer-header">
          <div className="explainer-logo">
            <span className="explainer-logo-icon">🚚</span>
            <div>
              <div className="explainer-logo-name">LogiSense</div>
              <div className="explainer-logo-sub">Real-Time Logistics Intelligence</div>
            </div>
          </div>
          <button className="explainer-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="explainer-body">

          {/* WHAT */}
          <section className="explainer-section">
            <div className="explainer-section-label explainer-section-label--what">
              <span className="explainer-badge">WHAT?</span>
              <span>The Problem We Solve</span>
            </div>
            <h2 className="explainer-section-title" id="explainer-title">
              Fragmented delivery data makes it impossible to know real-time capacity
            </h2>
            <p className="explainer-text">
              Our company has delivery data spread across many systems — riders, hubs, carrier partners,
              and city zones each have their own dashboards. This makes it extremely difficult to know
              <strong> real-time delivery capacity</strong> and identify shortage areas quickly.
            </p>
            <div className="explainer-feature-grid">
              {[
                { icon:'📦', title:'Available Capacity', desc:'Know exactly how many delivery slots remain across all 15 cities in real time.' },
                { icon:'🔴', title:'Overloaded Areas', desc:'Instantly spot zones where demand has exceeded physical delivery capacity.' },
                { icon:'⚖️', title:'Demand vs Capacity', desc:'Compare live order volumes against available fleet, riders, and hub space.' },
                { icon:'📅', title:'Future Shortages', desc:'14-day forecast identifies shortage windows before delivery failures happen.' },
              ].map(f => (
                <div key={f.title} className="explainer-feature-card">
                  <div className="explainer-feature-icon">{f.icon}</div>
                  <div>
                    <div className="explainer-feature-title">{f.title}</div>
                    <div className="explainer-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="explainer-divider" />

          {/* WHY */}
          <section className="explainer-section">
            <div className="explainer-section-label explainer-section-label--why">
              <span className="explainer-badge explainer-badge--why">WHY?</span>
              <span>Business Outcomes</span>
            </div>
            <h2 className="explainer-section-title">
              Every 1% improvement in delivery success = measurable revenue impact
            </h2>
            <div className="explainer-outcomes-grid">
              {[
                { icon:'💰', title:'Reduce Operational Costs', desc:'Optimize rider, fleet, and warehouse utilization. Avoid unnecessary capacity spend.' },
                { icon:'📈', title:'Increase Revenue', desc:'Better capacity planning allows handling more orders without failures or cancellations.' },
                { icon:'🎯', title:'Reduce Peak Season Losses', desc:'Predict and prepare for festivals, flash sales, and demand spikes 14 days in advance.' },
                { icon:'😊', title:'Improve Customer Retention', desc:'Faster, reliable deliveries lead to repeat customers and higher NPS scores.' },
                { icon:'⚡', title:'Faster Business Decisions', desc:'Real-time insights eliminate dependency on manual reports and slow spreadsheet analysis.' },
                { icon:'🌍', title:'Support Scalability', desc:'Makes it easier to expand operations across more cities and zones without chaos.' },
              ].map(o => (
                <div key={o.title} className="explainer-outcome-card">
                  <div className="explainer-outcome-icon">{o.icon}</div>
                  <div>
                    <div className="explainer-outcome-title">{o.title}</div>
                    <div className="explainer-outcome-desc">{o.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="explainer-divider" />

          {/* HOW */}
          <section className="explainer-section">
            <div className="explainer-section-label explainer-section-label--how">
              <span className="explainer-badge explainer-badge--how">HOW?</span>
              <span>Technical Architecture</span>
            </div>
            <h2 className="explainer-section-title">
              Three steps to a fully centralized real-time logistics intelligence platform
            </h2>
            <div className="explainer-steps">
              {[
                {
                  step:'01', icon:'📊', color:'#6366f1',
                  title:'Real-Time Monitoring Dashboard',
                  points:[
                    'Total delivery capacity across 15 Indian cities',
                    'Active riders, vehicles, and fleet breakdown (bikes/vans/trucks)',
                    'City/zone warehouse space utilization',
                    'Pending vs completed deliveries',
                    'First-mile and last-mile performance tracking',
                    'Delivery success rate, delay rate, SLA compliance',
                    'Rider performance: deliveries/day, retry rate',
                  ],
                },
                {
                  step:'02', icon:'🗺️', color:'#10b981',
                  title:'Map-Based Heatmap for Zone Visibility',
                  points:[
                    '🟢 Green = Healthy (< 65% capacity utilization)',
                    '🟡 Yellow = Medium Load (65%–85% utilization)',
                    '🔴 Red = Overloaded / Shortage (> 85% utilization)',
                    'Toggle views: Demand intensity, Rider density, Hub fill, Shortage zones',
                    'Click any city for carrier status, fleet data, and retry metrics',
                    'Live alert feed showing real-time capacity events',
                  ],
                },
                {
                  step:'03', icon:'🔮', color:'#f59e0b',
                  title:'Forecasting & Scenario Simulation',
                  points:[
                    '14-day capacity forecast using historical demand trends',
                    'Automatic flagging of projected shortage windows',
                    'Festival/event detection: Diwali, Eid, Flash Sales, Weekends',
                    'Early alerts for zones with predicted capacity shortages',
                    'Scenario simulator: test festival demand surge, carrier failure, emergency riders',
                    'AI-generated recommendations: when to pre-book carriers, activate standby riders',
                  ],
                },
              ].map(s => (
                <div key={s.step} className="explainer-step">
                  <div className="explainer-step-header">
                    <div className="explainer-step-num" style={{ background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44` }}>
                      Step {s.step}
                    </div>
                    <div className="explainer-step-icon">{s.icon}</div>
                    <div className="explainer-step-title">{s.title}</div>
                  </div>
                  <ul className="explainer-step-points">
                    {s.points.map((p, i) => (
                      <li key={i} className="explainer-step-point">{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <div className="explainer-divider" />

          {/* Tech stack */}
          <section className="explainer-section">
            <div className="explainer-section-label">
              <span className="explainer-badge explainer-badge--tech">TECH</span>
              <span>Data & Architecture</span>
            </div>
            <div className="explainer-tech-grid">
              {[
                { icon:'⚛️',  name:'React + Vite',   role:'Frontend SPA' },
                { icon:'🟢',  name:'Node.js + Express', role:'REST API Server' },
                { icon:'🍃',  name:'MongoDB Atlas',  role:'Data Storage' },
                { icon:'⚡',  name:'Socket.io',      role:'Live 5s Data Tick' },
                { icon:'📊',  name:'Chart.js',       role:'Analytics Charts' },
                { icon:'🗺️', name:'Leaflet',         role:'India Heatmap' },
              ].map(t => (
                <div key={t.name} className="explainer-tech-card">
                  <span className="explainer-tech-icon">{t.icon}</span>
                  <div>
                    <div className="explainer-tech-name">{t.name}</div>
                    <div className="explainer-tech-role">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        <div className="explainer-footer">
          <span>LogiSense © 2025 — MERN Stack Real-Time Logistics Dashboard</span>
          <button className="btn btn--primary" onClick={onClose}>Close ✕</button>
        </div>
      </div>
    </div>
  );
}
