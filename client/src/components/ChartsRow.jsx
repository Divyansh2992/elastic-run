import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

const GRID   = 'rgba(148,163,184,0.08)';
const TICK   = '#64748b';
const TOOLTIP = {
  backgroundColor: '#1e293b',
  borderColor:     'rgba(148,163,184,0.2)',
  borderWidth:     1,
  titleColor:      '#f1f5f9',
  bodyColor:       '#94a3b8',
  padding:         12,
};
const commonScales = (yLabel = '') => ({
  x: { grid: { color: GRID }, ticks: { color: TICK, font: { family: 'Inter' } } },
  y: { grid: { color: GRID }, ticks: { color: TICK, font: { family: 'Inter' } },
    title: yLabel ? { display: true, text: yLabel, color: TICK } : undefined },
});

// ── 1. Demand vs Capacity ─────────────────────────
function DemandChart({ cities }) {
  const top10 = [...cities].slice(0, 10);
  const data = {
    labels: top10.map(c => c.name),
    datasets: [
      {
        label: 'Demand',
        data: top10.map(c => c.pending + c.completed),
        backgroundColor: 'rgba(244,63,94,0.75)',
        borderColor: '#f43f5e',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Capacity',
        data: top10.map(c => c.capacity),
        backgroundColor: 'rgba(16,185,129,0.75)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };
  return (
    <Bar data={data} options={{
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { family: 'Inter' } } }, tooltip: TOOLTIP },
      scales: commonScales('Orders'),
    }} />
  );
}

// ── 2. First-Mile / Last-Mile ─────────────────────
function MileChart({ cities }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fm = days.map((_, i) => cities.reduce((s, c) => s + (c.firstMile?.[i] ?? 0), 0));
  const lm = days.map((_, i) => cities.reduce((s, c) => s + (c.lastMile?.[i]  ?? 0), 0));

  const data = {
    labels: days,
    datasets: [
      { label: 'First Mile', data: fm, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)', tension: 0.45, fill: true, pointBackgroundColor: '#3b82f6', borderWidth: 2.5, pointRadius: 4 },
      { label: 'Last Mile',  data: lm, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.10)', tension: 0.45, fill: true, pointBackgroundColor: '#a855f7', borderWidth: 2.5, pointRadius: 4 },
    ],
  };
  return (
    <Line data={data} options={{
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { family: 'Inter' } } }, tooltip: TOOLTIP },
      scales: commonScales('Packages'),
    }} />
  );
}

// ── 3. Rider distribution doughnut ────────────────
function RiderChart({ cities }) {
  const buckets = { '<5': 0, '5–10': 0, '10–15': 0, '15–20': 0, '>20': 0 };
  cities.forEach(c => {
    const d = c.deliveriesPerRider ?? 0;
    if      (d < 5)  buckets['<5']++;
    else if (d < 10) buckets['5–10']++;
    else if (d < 15) buckets['10–15']++;
    else if (d < 20) buckets['15–20']++;
    else             buckets['>20']++;
  });
  const data = {
    labels: Object.keys(buckets),
    datasets: [{
      data: Object.values(buckets),
      backgroundColor: ['rgba(239,68,68,0.8)','rgba(245,158,11,0.8)','rgba(59,130,246,0.8)','rgba(16,185,129,0.8)','rgba(168,85,247,0.8)'],
      borderColor: '#0f1629', borderWidth: 3, hoverOffset: 8,
    }],
  };
  return (
    <Doughnut data={data} options={{
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      animation: { duration: 800 },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, padding: 14, font: { family: 'Inter' } } },
        tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} cities` } },
      },
    }} />
  );
}

// ── Main export ───────────────────────────────────
export default function ChartsRow() {
  const { state } = useApp();
  const cities = state.cities;

  return (
    <div className="charts-row">
      <div className="chart-card card">
        <div className="chart-title">⚖️ Demand vs. Capacity — Top 10 Cities</div>
        <div className="chart-wrap"><DemandChart cities={cities} /></div>
      </div>
      <div className="chart-card card">
        <div className="chart-title">🚀 First-Mile vs. Last-Mile — 7-Day</div>
        <div className="chart-wrap"><MileChart cities={cities} /></div>
      </div>
      <div className="chart-card card">
        <div className="chart-title">🛵 Rider Deliveries/Day Distribution</div>
        <div className="chart-wrap"><RiderChart cities={cities} /></div>
      </div>
    </div>
  );
}
