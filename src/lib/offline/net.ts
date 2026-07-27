/** Detecção de conectividade: navigator.onLine + heartbeat leve. */

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let lastKnown = true;
const listeners = new Set<(online: boolean) => void>();

async function probe(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    const res = await fetch("/favicon.ico", {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

function emit(online: boolean) {
  if (online === lastKnown) return;
  lastKnown = online;
  listeners.forEach((fn) => fn(online));
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false && lastKnown;
}

export async function checkOnline(): Promise<boolean> {
  const ok = await probe();
  emit(ok);
  return ok;
}

export function subscribeNetwork(fn: (online: boolean) => void): () => void {
  listeners.add(fn);
  if (typeof window !== "undefined" && !heartbeatTimer) {
    const onUp = () => void checkOnline();
    const onDown = () => emit(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    heartbeatTimer = setInterval(() => void checkOnline(), 30000);
    void checkOnline();
  }
  return () => {
    listeners.delete(fn);
  };
}
