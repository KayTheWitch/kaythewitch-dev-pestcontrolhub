/**
 * Registro do service worker do app.
 *
 * Regra de ouro: NUNCA registrar em desenvolvimento, dentro de iframe ou em
 * qualquer host de preview da Lovable — o SW guardaria HTML antigo e o editor
 * passaria a servir telas desatualizadas. `?sw=off` funciona como kill switch.
 */

const SW_URL = "/sw.js";

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function isRegistrationAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  if (isPreviewHost(window.location.hostname)) return false;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return false;
  return true;
}

async function unregisterAppServiceWorkers() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;

  if (!isRegistrationAllowed()) {
    void unregisterAppServiceWorkers();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      /* falha de registro não pode quebrar o app */
    });
  });
}

/** Indica se o app está rodando instalado (standalone). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as any).standalone === true
  );
}
