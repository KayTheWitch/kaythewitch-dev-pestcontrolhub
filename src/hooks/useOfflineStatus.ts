import { useEffect, useState } from "react";
import { subscribeNetwork, isOnline, checkOnline } from "@/lib/offline/net";
import { subscribeSync, syncSummary, startAutoSync, processQueue } from "@/lib/offline/sync";
import { getMeta } from "@/lib/offline/db";

export type OfflineState = {
  online: boolean;
  pendentes: number;
  conflitos: number;
  running: boolean;
  oldestAt: string | null;
  lastSyncAt: string | null;
  refresh: () => void;
  syncNow: () => void;
};

export function useOfflineStatus(): OfflineState {
  const [online, setOnline] = useState(true);
  const [state, setState] = useState({
    pendentes: 0,
    conflitos: 0,
    running: false,
    oldestAt: null as string | null,
  });
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setOnline(isOnline());
    const off = subscribeNetwork(setOnline);
    startAutoSync();
    return off;
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const s = await syncSummary();
        const last = await getMeta<string>("lastSyncAt");
        if (!alive) return;
        setState({
          pendentes: s.pendentes,
          conflitos: s.conflitos,
          running: s.running,
          oldestAt: s.oldestAt,
        });
        setLastSyncAt(last ?? null);
      } catch {
        /* IndexedDB indisponível */
      }
    };
    void load();
    const off = subscribeSync(() => void load());
    const timer = setInterval(load, 20000);
    return () => {
      alive = false;
      off();
      clearInterval(timer);
    };
  }, [tick]);

  return {
    online,
    ...state,
    lastSyncAt,
    refresh: () => setTick((t) => t + 1),
    syncNow: () => {
      void checkOnline().then(() => processQueue({ force: true }));
    },
  };
}
