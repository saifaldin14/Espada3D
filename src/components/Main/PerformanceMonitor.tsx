import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Module-level shared state for cross-Canvas-boundary communication
const fpsListeners: Set<(fps: number) => void> = new Set();
let currentFPS = 0;

export function subscribeFPS(cb: (fps: number) => void): () => void {
  fpsListeners.add(cb);
  return () => {
    fpsListeners.delete(cb);
  };
}

const WINDOW_SIZE = 60;
const UPDATE_INTERVAL_MS = 500;

/**
 * Render this component inside a R3F Canvas.
 * It tracks frame times and publishes average FPS to subscribers.
 */
export const PerformanceMonitor: React.FC = () => {
  const frameTimes = useRef<number[]>([]);
  const lastPublish = useRef(0);

  useFrame((_state, delta) => {
    const times = frameTimes.current;
    times.push(delta);
    if (times.length > WINDOW_SIZE) {
      times.shift();
    }

    const now = performance.now();
    if (now - lastPublish.current >= UPDATE_INTERVAL_MS && times.length > 0) {
      lastPublish.current = now;
      const avgDelta = times.reduce((sum, d) => sum + d, 0) / times.length;
      const fps = avgDelta > 0 ? Math.round(1 / avgDelta) : 0;
      currentFPS = fps;
      fpsListeners.forEach((cb) => cb(fps));
    }
  });

  return null;
};

/**
 * Hook for components OUTSIDE the Canvas to read the current FPS value.
 */
export function useFPS(): number {
  const [fps, setFps] = useState(currentFPS);

  useEffect(() => {
    return subscribeFPS(setFps);
  }, []);

  return fps;
}
