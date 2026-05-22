import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { fetchCities, fetchKPIs, fetchAlerts, fetchForecast, socket } from '../services/api';

// ── Initial state ──────────────────────────────────
const initial = {
  cities:    [],
  kpis:      {},
  alerts:    [],
  forecast:  [],
  connected: false,
  lastUpdate: null,
  loading:   true,
  error:     null,
};

// ── Reducer ───────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'INIT_DONE':
      return { ...state, ...action.payload, loading: false };
    case 'TICK':
      return { ...state, cities: action.cities, kpis: action.kpis, lastUpdate: new Date() };
    case 'ALERT_NEW':
      return { ...state, alerts: [action.alert, ...state.alerts].slice(0, 50) };
    case 'SET_CONNECTED':
      return { ...state, connected: action.connected };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Initial data load
  useEffect(() => {
    Promise.all([fetchCities(), fetchKPIs(), fetchAlerts(30), fetchForecast()])
      .then(([cities, kpis, alerts, forecast]) => {
        dispatch({ type: 'INIT_DONE', payload: { cities, kpis, alerts, forecast, lastUpdate: new Date() } });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: err.message }));
  }, []);

  // Socket.io subscriptions
  useEffect(() => {
    socket.on('connect',    () => dispatch({ type: 'SET_CONNECTED', connected: true }));
    socket.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', connected: false }));

    socket.on('data:tick', ({ cities, kpis }) => {
      dispatch({ type: 'TICK', cities, kpis });
    });

    socket.on('alert:new', (alert) => {
      dispatch({ type: 'ALERT_NEW', alert });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('data:tick');
      socket.off('alert:new');
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
