import { supabase } from "@/integrations/supabase/client";
import { deleteOsCache, getOsCache, listOsCache, putOsCache, type CachedOs } from "./db";

/** Baixa tudo que a execução em campo precisa e grava no aparelho. */
export async function prepareOsForOffline(osId: string): Promise<CachedOs> {
  const [osRes, produtosRes, lotesRes, rtRes] = await Promise.all([
    supabase
      .from("service_orders")
      .select("*, clients(*), teams(id, nome)")
      .eq("id", osId)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, nome, unidade, registro_ms, principio_ativo")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("product_batches")
      .select("id, product_id, batch_number, expiry_date, quantity_on_hand")
      .eq("active", true)
      .gt("quantity_on_hand", 0),
    supabase
      .from("technical_responsibles")
      .select("id, nome, conselho, registro, art_numero, art_validade")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (osRes.error) throw osRes.error;
  if (!osRes.data) throw new Error("Ordem de serviço não encontrada.");

  const entry: CachedOs = {
    id: osId,
    numero: (osRes.data as any).numero,
    cachedAt: new Date().toISOString(),
    os: osRes.data,
    client: (osRes.data as any).clients ?? null,
    produtos: (produtosRes.data ?? []) as any[],
    lotes: (lotesRes.data ?? []) as any[],
    rt: (rtRes.data ?? [])[0] ?? null,
  };

  await putOsCache(entry);
  return entry;
}

/** Prepara todas as OS abertas com data prevista até `dias` à frente. */
export async function prepareTodayOs(dias = 2): Promise<number> {
  const hoje = new Date();
  const limite = new Date(hoje.getTime() + dias * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("service_orders")
    .select("id")
    .in("status", ["aguardando_execucao", "em_deslocamento", "em_execucao"])
    .lte("data_prevista", iso(limite));
  if (error) throw error;

  const ids = (data ?? []).map((r: any) => r.id);
  for (const id of ids) await prepareOsForOffline(id);
  return ids.length;
}

export { getOsCache, listOsCache, deleteOsCache };
