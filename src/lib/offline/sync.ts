import { supabase } from "@/integrations/supabase/client";
import {
  deletePhoto,
  getPhoto,
  listQueue,
  saveQueueItem,
  setMeta,
  type QueueItem,
} from "./db";
import { dataUrlToBlob } from "./image";
import { checkOnline } from "./net";

const BUCKET = "os-fotos";

type Listener = () => void;
const listeners = new Set<Listener>();
let running = false;

export function subscribeSync(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export async function syncSummary() {
  const items = await listQueue();
  const pendentes = items.filter((i) => i.status === "pendente" || i.status === "erro");
  const conflitos = items.filter((i) => i.status === "conflito");
  const oldest = pendentes.concat(conflitos).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  return {
    items,
    pendentes: pendentes.length,
    conflitos: conflitos.length,
    total: pendentes.length + conflitos.length,
    oldestAt: oldest?.createdAt ?? null,
    running,
  };
}

class ConflictError extends Error {}

function backoffMs(attempts: number) {
  return Math.min(5 * 60_000, 5_000 * 2 ** Math.max(0, attempts - 1));
}

/* ------------------------------------------------------------------ */
/* Processamento de um item                                            */
/* ------------------------------------------------------------------ */

async function alreadySynced(item: QueueItem): Promise<boolean> {
  const { data } = await supabase
    .from("service_order_events")
    .select("id")
    .eq("service_order_id", item.osId)
    .eq("tipo", "sync_offline")
    .contains("payload", { key: item.id })
    .maybeSingle();
  return !!data;
}

async function uploadPhotos(item: QueueItem) {
  for (const photoId of item.payload.photoIds) {
    const rec = await getPhoto(photoId);
    if (!rec) continue;
    const path = `${item.osId}/${photoId}.jpg`;
    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, rec.blob, { upsert: true, contentType: rec.blob.type || "image/jpeg" });
    if (up.error) throw up.error;

    const { data: existing } = await supabase
      .from("service_order_photos")
      .select("id")
      .eq("storage_path", path)
      .maybeSingle();
    if (!existing) {
      const ins = await supabase.from("service_order_photos").insert({
        service_order_id: item.osId,
        storage_path: path,
        legenda: rec.legenda,
      });
      if (ins.error) throw ins.error;
    }
  }
}

async function uploadSignature(item: QueueItem): Promise<any | null> {
  const sig = item.payload.assinatura;
  if (!sig) return null;
  const path = `${item.osId}/assinatura-${item.id}.png`;
  const blob = dataUrlToBlob(sig.dataUrl);
  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "image/png" });
  if (up.error) throw up.error;
  return { nome: sig.nome, storage_path: path, assinado_em: item.payload.checkout_at };
}

async function syncProducts(item: QueueItem) {
  const del = await supabase
    .from("service_order_products")
    .delete()
    .eq("service_order_id", item.osId);
  if (del.error) throw del.error;

  const rows = item.payload.produtos.map((p) => ({
    service_order_id: item.osId,
    product_id: p.product_id,
    nome: p.nome,
    unidade: p.unidade,
    quantidade_aplicada: p.quantidade_aplicada,
    lote: p.lote,
    validade: p.validade,
    is_extra: p.is_extra,
  }));
  if (rows.length > 0) {
    const ins = await supabase.from("service_order_products").insert(rows);
    if (ins.error) throw ins.error;
  }
}

export async function processItem(item: QueueItem): Promise<void> {
  if (await alreadySynced(item)) {
    item.status = "concluido";
    item.lastError = null;
    await saveQueueItem(item);
    return;
  }

  const { data: current, error: curErr } = await supabase
    .from("service_orders")
    .select("id, status")
    .eq("id", item.osId)
    .maybeSingle();
  if (curErr) throw curErr;
  if (!current) throw new ConflictError("Ordem de serviço não encontrada no servidor.");

  // 1. fotos e assinatura
  await uploadPhotos(item);
  const assinatura = await uploadSignature(item);

  // 2. produtos aplicados
  await syncProducts(item);

  // 3. baixa de estoque (idempotente no banco)
  const rpc = await supabase.rpc("apply_os_stock_deduction", { _os_id: item.osId });
  if (rpc.error) throw new ConflictError(rpc.error.message);

  // 4. status e dados de campo (dispara CES, financeiro e demais automações)
  const upd = await supabase
    .from("service_orders")
    .update({
      checkin_at: item.payload.checkin_at,
      checkin_lat: item.payload.checkin_lat,
      checkin_lng: item.payload.checkin_lng,
      checkout_at: item.payload.checkout_at,
      checklist: item.payload.checklist,
      observacoes_campo: item.payload.observacoes_campo,
      ...(assinatura ? { assinatura_responsavel: assinatura } : {}),
      status: "concluida" as const,
    })
    .eq("id", item.osId);
  if (upd.error) throw upd.error;

  // 5. marca a chave de idempotência
  await supabase.from("service_order_events").insert({
    service_order_id: item.osId,
    tipo: "sync_offline",
    payload: { key: item.id, sincronizado_em: new Date().toISOString() },
  });

  for (const photoId of item.payload.photoIds) await deletePhoto(photoId);

  item.status = "concluido";
  item.lastError = null;
  await saveQueueItem(item);
}

/* ------------------------------------------------------------------ */
/* Processamento da fila                                               */
/* ------------------------------------------------------------------ */

export async function processQueue(options: { force?: boolean } = {}) {
  if (running) return;
  const items = (await listQueue()).filter((i) =>
    options.force
      ? i.status !== "concluido"
      : (i.status === "pendente" || i.status === "erro") &&
        new Date(i.nextAttemptAt).getTime() <= Date.now(),
  );
  if (items.length === 0) return;

  if (!(await checkOnline())) return;

  running = true;
  notify();
  try {
    for (const item of items) {
      item.status = "processando";
      await saveQueueItem(item);
      notify();
      try {
        await processItem(item);
      } catch (e: any) {
        item.attempts += 1;
        item.lastError = e?.message ?? String(e);
        item.status = e instanceof ConflictError ? "conflito" : "erro";
        item.nextAttemptAt = new Date(Date.now() + backoffMs(item.attempts)).toISOString();
        await saveQueueItem(item);
      }
      notify();
    }
    await setMeta("lastSyncAt", new Date().toISOString());
  } finally {
    running = false;
    notify();
  }
}

/** Reprocessa um item específico (usado após resolver conflito). */
export async function retryItem(item: QueueItem) {
  item.status = "pendente";
  item.nextAttemptAt = new Date().toISOString();
  item.lastError = null;
  await saveQueueItem(item);
  notify();
  await processQueue({ force: true });
}

let autoTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoSync() {
  if (typeof window === "undefined" || autoTimer) return;
  const run = () => void processQueue();
  window.addEventListener("online", run);
  autoTimer = setInterval(run, 60_000);
  run();
}
