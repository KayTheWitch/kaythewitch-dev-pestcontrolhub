import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type CachedBatch = {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string | null;
  quantity_on_hand: number;
};

export type CachedProduct = {
  id: string;
  nome: string;
  unidade: string | null;
  registro_ms: string | null;
  principio_ativo: string | null;
};

export type CachedOs = {
  id: string;
  numero: number;
  cachedAt: string;
  os: any;
  client: any;
  produtos: CachedProduct[];
  lotes: CachedBatch[];
  rt: {
    id: string;
    nome: string;
    conselho: string;
    registro: string;
    art_numero: string | null;
    art_validade: string | null;
  } | null;
};

export type ExecutionProduct = {
  product_id: string | null;
  nome: string;
  unidade: string | null;
  quantidade_aplicada: number;
  lote: string | null;
  validade: string | null;
  is_extra: boolean;
};

export type ExecutionPayload = {
  osId: string;
  numero: number;
  checkin_at: string | null;
  checkin_lat: number | null;
  checkin_lng: number | null;
  checkout_at: string | null;
  checklist: any[];
  produtos: ExecutionProduct[];
  assinatura: { nome: string; dataUrl: string } | null;
  observacoes_campo: string;
  photoIds: string[];
};

export type QueueStatus = "pendente" | "processando" | "erro" | "conflito" | "concluido";

export type QueueItem = {
  id: string;
  osId: string;
  numero: number;
  status: QueueStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  nextAttemptAt: string;
  payload: ExecutionPayload;
};

export type PhotoRecord = {
  id: string;
  osId: string;
  blob: Blob;
  legenda: string | null;
  createdAt: string;
};

interface OfflineDB extends DBSchema {
  os_cache: { key: string; value: CachedOs };
  sync_queue: { key: string; value: QueueItem; indexes: { by_os: string } };
  photo_blobs: { key: string; value: PhotoRecord; indexes: { by_os: string } };
  meta: { key: string; value: any };
}

const DB_NAME = "pest-control-hub-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export function offlineAvailable(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function db() {
  if (!offlineAvailable()) {
    return Promise.reject(new Error("Armazenamento offline indisponível neste dispositivo."));
  }
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("os_cache")) {
          database.createObjectStore("os_cache", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("sync_queue")) {
          const s = database.createObjectStore("sync_queue", { keyPath: "id" });
          s.createIndex("by_os", "osId");
        }
        if (!database.objectStoreNames.contains("photo_blobs")) {
          const s = database.createObjectStore("photo_blobs", { keyPath: "id" });
          s.createIndex("by_os", "osId");
        }
        if (!database.objectStoreNames.contains("meta")) {
          database.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------------------------------------------ */
/* Cache de OS                                                         */
/* ------------------------------------------------------------------ */

export async function putOsCache(entry: CachedOs) {
  return (await db()).put("os_cache", entry);
}

export async function getOsCache(id: string) {
  return (await db()).get("os_cache", id);
}

export async function listOsCache() {
  return (await db()).getAll("os_cache");
}

export async function deleteOsCache(id: string) {
  return (await db()).delete("os_cache", id);
}

/* ------------------------------------------------------------------ */
/* Fila de sincronização                                               */
/* ------------------------------------------------------------------ */

export async function enqueueExecution(payload: ExecutionPayload) {
  const now = new Date().toISOString();
  const item: QueueItem = {
    id: newId(),
    osId: payload.osId,
    numero: payload.numero,
    status: "pendente",
    attempts: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    nextAttemptAt: now,
    payload,
  };
  await (await db()).put("sync_queue", item);
  return item;
}

export async function listQueue(): Promise<QueueItem[]> {
  const rows = await (await db()).getAll("sync_queue");
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getQueueItem(id: string) {
  return (await db()).get("sync_queue", id);
}

export async function saveQueueItem(item: QueueItem) {
  item.updatedAt = new Date().toISOString();
  return (await db()).put("sync_queue", item);
}

export async function deleteQueueItem(id: string) {
  return (await db()).delete("sync_queue", id);
}

export async function pendingQueueForOs(osId: string) {
  const all = await listQueue();
  return all.filter((i) => i.osId === osId && i.status !== "concluido");
}

/* ------------------------------------------------------------------ */
/* Fotos                                                               */
/* ------------------------------------------------------------------ */

export async function putPhoto(rec: PhotoRecord) {
  return (await db()).put("photo_blobs", rec);
}

export async function getPhoto(id: string) {
  return (await db()).get("photo_blobs", id);
}

export async function listPhotosForOs(osId: string) {
  return (await db()).getAllFromIndex("photo_blobs", "by_os", osId);
}

export async function deletePhoto(id: string) {
  return (await db()).delete("photo_blobs", id);
}

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

export async function setMeta(key: string, value: any) {
  return (await db()).put("meta", value, key);
}

export async function getMeta<T = any>(key: string): Promise<T | undefined> {
  return (await db()).get("meta", key) as Promise<T | undefined>;
}

/** Uso do armazenamento local (para avisar antes de estourar a cota). */
export async function storageUsage(): Promise<{ usage: number; quota: number; pct: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota, pct: quota > 0 ? usage / quota : 0 };
}
