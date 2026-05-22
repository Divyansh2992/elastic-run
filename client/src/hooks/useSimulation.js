import { useState, useCallback } from 'react';
import { runSimulation } from '../services/api';

export function useSimulation() {
  const [params, setParams]   = useState({ demandMultiplier: 1.0, carrierFailurePct: 0, extraRiders: 0 });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const updateParam = useCallback((key, value) => {
    setParams(p => ({ ...p, [key]: value }));
    setResult(null); // clear old result when params change
  }, []);

  const simulate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation(params);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const reset = useCallback(() => {
    setParams({ demandMultiplier: 1.0, carrierFailurePct: 0, extraRiders: 0 });
    setResult(null);
    setError(null);
  }, []);

  return { params, result, loading, error, updateParam, simulate, reset };
}
