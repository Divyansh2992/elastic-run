import axios from 'axios';
import { io } from 'socket.io-client';

// ── Axios instance ────────────────────────────────
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ── API calls ─────────────────────────────────────
export const fetchCities        = () => api.get('/cities').then(r => r.data);
export const fetchKPIs          = () => api.get('/cities/kpis').then(r => r.data);
export const fetchAlerts        = (limit = 30) => api.get(`/alerts?limit=${limit}`).then(r => r.data);
export const fetchForecast      = () => api.get('/forecast').then(r => r.data);
export const fetchRouteLocation = (cityId) => api.get(`/routes/location/${cityId}`).then(r => r.data);
export const searchRoutes       = (query) => api.get(`/routes?search=${encodeURIComponent(query)}`).then(r => r.data);
export const fetchCapacity      = () => api.get('/capacity/states').then(r => r.data);
export const fetchCapacitySummary = () => api.get('/capacity/summary').then(r => r.data);

// ── Socket.io client ──────────────────────────────
export const socket = io('/', {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 10,
});
