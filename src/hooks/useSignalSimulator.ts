import { useState, useEffect, useRef, useCallback } from 'react';

export type SignalType = 'progress_update' | 'blocker' | 'assumption_risk' | 'info';

export interface AISignal {
  id: string;
  type: SignalType;
  message: string;
  moduleId?: string;
  moduleName?: string;
  timestamp: number;
}

const SIGNAL_POOL: Omit<AISignal, 'id' | 'timestamp'>[] = [
  { type: 'progress_update', message: 'Product Catalog advanced from 35% → 42%', moduleId: 'mod-1', moduleName: 'Product Catalog' },
  { type: 'blocker', message: 'ERP Integration: API spec still pending from Daikin IT', moduleId: 'mod-3', moduleName: 'ERP Integration' },
  { type: 'assumption_risk', message: 'Assumption at risk: CDN availability not confirmed', moduleName: 'Product Catalog' },
  { type: 'progress_update', message: 'User Onboarding Flow moved to in-progress', moduleId: 'mod-2', moduleName: 'User Onboarding' },
  { type: 'info', message: 'Meeting notes from Apr 3 processed — 2 new extractions', },
  { type: 'progress_update', message: 'Warranty Lookup: 3 story points merged today', moduleName: 'Warranty Lookup' },
  { type: 'blocker', message: 'Auth module: Azure AD sandbox access delayed', moduleName: 'Auth & SSO' },
  { type: 'info', message: 'Delivery pace on track — 2.1 modules/week vs. target 2.0' },
  { type: 'assumption_risk', message: 'Client dependency overdue by 2d — escalation recommended' },
  { type: 'progress_update', message: 'Service Scheduling: design handoff received from UX' },
];

const MIN_INTERVAL = 8_000;
const MAX_INTERVAL = 20_000;

function randomSignal(): AISignal {
  const base = SIGNAL_POOL[Math.floor(Math.random() * SIGNAL_POOL.length)];
  return { ...base, id: Math.random().toString(36).slice(2), timestamp: Date.now() };
}

/**
 * Emits mock AI signals on a random interval (8–20s).
 * Returns the queue of recent signals and a dismiss function.
 */
export function useSignalSimulator(enabled = true) {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(() => {
    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    timerRef.current = setTimeout(() => {
      if (!enabled) return;
      const signal = randomSignal();
      setSignals((prev) => [signal, ...prev].slice(0, 5)); // keep last 5
      scheduleNext();
    }, delay);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, scheduleNext]);

  const dismiss = useCallback((id: string) => {
    setSignals((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const latestSignal = signals[0] ?? null;

  return { signals, latestSignal, dismiss };
}
