import { useCallback, useEffect, useRef, useState } from 'react';
import { SimulationEngine } from '../engine/simulationEngine.js';
import { SIMULATION_CONFIG, SIMULATION_STATUS } from '../engine/simulationConfig.js';
import { normalizeSimulationParams } from '../utils/validateParams.js';

export function useSimulation(initialParams) {
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine(normalizeSimulationParams(initialParams ?? {}));
  }

  const rafRef = useRef(null);
  const accumulatorRef = useRef(0);
  const lastFrameRef = useRef(null);
  const [state, setState] = useState(() => engineRef.current.getState());

  const syncState = useCallback(() => {
    setState({ ...engineRef.current.getState() });
  }, []);

  const tick = useCallback(
    (timestamp) => {
      const engine = engineRef.current;
      const current = engine.getState();

      if (current.status !== SIMULATION_STATUS.RUNNING) {
        rafRef.current = null;
        lastFrameRef.current = null;
        return;
      }

      if (lastFrameRef.current == null) {
        lastFrameRef.current = timestamp;
      }

      const deltaMs = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      const speed = current.params.simulationSpeed ?? 1;
      accumulatorRef.current += (deltaMs / 1000) * speed;

      const dt = SIMULATION_CONFIG.DEFAULT_TIMESTEP;
      let stepped = false;
      while (accumulatorRef.current >= dt) {
        engine.step(dt);
        accumulatorRef.current -= dt;
        stepped = true;
      }

      if (stepped) {
        syncState();
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [syncState],
  );

  const ensureLoop = useCallback(() => {
    if (rafRef.current == null) {
      lastFrameRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
    accumulatorRef.current = 0;
  }, []);

  useEffect(() => () => stopLoop(), [stopLoop]);

  const start = useCallback(() => {
    engineRef.current.start();
    syncState();
    ensureLoop();
  }, [ensureLoop, syncState]);

  const pause = useCallback(() => {
    engineRef.current.pause();
    stopLoop();
    syncState();
  }, [stopLoop, syncState]);

  const resume = useCallback(() => {
    engineRef.current.resume();
    syncState();
    ensureLoop();
  }, [ensureLoop, syncState]);

  const stop = useCallback(() => {
    engineRef.current.stop();
    stopLoop();
    syncState();
  }, [stopLoop, syncState]);

  const reset = useCallback((params) => {
    stopLoop();
    const normalized = normalizeSimulationParams(params ?? engineRef.current.getState().params);
    engineRef.current.reset(normalized);
    syncState();
  }, [stopLoop, syncState]);

  const updateParams = useCallback(
    (partial) => {
      const normalized = normalizeSimulationParams({
        ...engineRef.current.getState().params,
        ...partial,
      });
      engineRef.current.setParams(normalized);
      syncState();
    },
    [syncState],
  );

  return {
    state,
    start,
    pause,
    resume,
    stop,
    reset,
    updateParams,
    engine: engineRef.current,
  };
}
