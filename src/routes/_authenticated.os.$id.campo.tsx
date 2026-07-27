import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CloudOff,
  Camera,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignaturePad } from "@/components/offline/SignaturePad";
import { prepareOsForOffline } from "@/lib/offline/os-offline";
import {
  enqueueExecution,
  getMeta,
  getOsCache,
  newId,
  putPhoto,
  setMeta,
  type CachedOs,
  type ExecutionProduct,
  offlineAvailable,
} from "@/lib/offline/db";
import { compressImage, formatBytes } from "@/lib/offline/image";
import { processQueue } from "@/lib/offline/sync";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/os/$id/campo")({
  component: FieldExecution,
});

type Draft = {
  checkin_at: string | null;
  checkin_lat: number | null;
  checkin_lng: number | null;
  checklist: { label: string; ok: boolean }[];
  produtos: ExecutionProduct[];
  observacoes_campo: string;
  assinaturaNome: string;
  assinaturaDataUrl: string | null;
  fotos: { id: string; size: number; legenda: string }[];
};

const emptyDraft: Draft = {
  checkin_at: null,
  checkin_lat: null,
  checkin_lng: null,
  checklist: [],
  produtos: [],
  observacoes_campo: "",
  assinaturaNome: "",
  assinaturaDataUrl: null,
  fotos: [],
};

function FieldExecution() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { online } = useOfflineStatus();

  const [cached, setCached] = useState<CachedOs | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let entry = offlineAvailable() ? await getOsCache(id) : undefined;
        if (entry) setFromCache(true);
        if (!entry && online) entry = await prepareOsForOffline(id);
        if (!alive) return;
        if (!entry) {
          toast.error("OS não disponível offline. Conecte-se e prepare a OS antes.");
          setLoading(false);
          return;
        }
        setCached(entry);
        const saved = offlineAvailable() ? await getMeta<Draft>(`draft:${id}`) : undefined;
        setDraft(
          saved ?? {
            ...emptyDraft,
            checklist: ((entry.os.checklist as any[]) ?? []).map((c) => ({
              label: c.label,
              ok: !!c.ok,
            })),
            produtos: ((entry.os.produtos_previstos as any[]) ?? []).map((p) => ({
              product_id: p.product_id ?? null,
              nome: p.nome,
              unidade: p.unidade ?? null,
              quantidade_aplicada: Number(p.quantidade) || 0,
              lote: null,
              validade: null,
              is_extra: false,
            })),
          },
        );
      } catch (e: any) {
        toast.error(e?.message ?? "Falha ao carregar a OS.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, online]);

  function update(patch: Partial<Draft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (offlineAvailable()) void setMeta(`draft:${id}`, next);
      return next;
    });
  }

  function doCheckin() {
    const stamp = new Date().toISOString();
    if (!navigator.geolocation) {
      update({ checkin_at: stamp });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        update({
          checkin_at: stamp,
          checkin_lat: p.coords.latitude,
          checkin_lng: p.coords.longitude,
        }),
      () => {
        update({ checkin_at: stamp });
        toast.message("Check-in registrado sem localização.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const added: Draft["fotos"] = [];
    for (const file of Array.from(files)) {
      const blob = await compressImage(file);
      const photoId = newId();
      await putPhoto({
        id: photoId,
        osId: id,
        blob,
        legenda: null,
        createdAt: new Date().toISOString(),
      });
      added.push({ id: photoId, size: blob.size, legenda: "" });
    }
    update({ fotos: [...draft.fotos, ...added] });
    toast.success(`${added.length} foto(s) guardada(s) no aparelho.`);
  }

  const lotesDoProduto = (productId: string | null) =>
    (cached?.lotes ?? []).filter((l) => l.product_id === productId);

  async function concluir() {
    if (!cached) return;
    if (!draft.checkin_at) return toast.error("Faça o check-in antes de concluir.");
    if (draft.checklist.some((c) => !c.ok))
      return toast.error("Conclua todos os itens do checklist.");
    if (!draft.produtos.length) return toast.error("Registre ao menos um produto aplicado.");
    if (draft.produtos.some((p) => !p.quantidade_aplicada))
      return toast.error("Informe a quantidade aplicada de cada produto.");
    if (!draft.assinaturaDataUrl || !draft.assinaturaNome.trim())
      return toast.error("Colete a assinatura e o nome do responsável.");

    setSaving(true);
    try {
      await enqueueExecution({
        osId: id,
        numero: cached.numero,
        checkin_at: draft.checkin_at,
        checkin_lat: draft.checkin_lat,
        checkin_lng: draft.checkin_lng,
        checkout_at: new Date().toISOString(),
        checklist: draft.checklist,
        produtos: draft.produtos,
        assinatura: { nome: draft.assinaturaNome.trim(), dataUrl: draft.assinaturaDataUrl },
        observacoes_campo: draft.observacoes_campo,
        photoIds: draft.fotos.map((f) => f.id),
      });
      await setMeta(`draft:${id}`, undefined);
      toast.success("Execução salva no aparelho. Será enviada quando houver rede.");
      void processQueue();
      router.navigate({ to: "/sync" });
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar a execução.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>;
  if (!cached)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Esta OS ainda não foi preparada para uso offline.{" "}
        <Link to="/os" className="text-primary hover:underline">
          Voltar para a lista
        </Link>
      </Card>
    );

  const totalFotos = draft.fotos.reduce((s, f) => s + f.size, 0);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
        <Link to="/os/$id" params={{ id }}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para a OS
        </Link>
      </Button>
      <PageHeader
        title={`Execução em campo — OS #${cached.numero}`}
        description={cached.client?.nome ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {(!online || fromCache) && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                <CloudOff className="w-3.5 h-3.5" />
                {online ? "Dados do cache" : "Modo offline"}
              </span>
            )}
            <Button onClick={concluir} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Concluir OS
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Check-in</h3>
            {draft.checkin_at ? (
              <div className="text-sm space-y-1">
                <div>Registrado em {formatDateTime(draft.checkin_at)}</div>
                <div className="text-muted-foreground text-xs">
                  {draft.checkin_lat != null
                    ? `Local: ${draft.checkin_lat.toFixed(5)}, ${draft.checkin_lng?.toFixed(5)}`
                    : "Sem coordenadas"}
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={doCheckin}>
                <MapPin className="w-4 h-4 mr-2" />
                Fazer check-in
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Checklist técnico</h3>
            <div className="space-y-1">
              {draft.checklist.length === 0 && (
                <div className="text-sm text-muted-foreground">Sem itens de checklist.</div>
              )}
              {draft.checklist.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                  <Checkbox
                    checked={item.ok}
                    onCheckedChange={(v) => {
                      const next = [...draft.checklist];
                      next[idx] = { ...item, ok: !!v };
                      update({ checklist: next });
                    }}
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Produtos aplicados</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update({
                    produtos: [
                      ...draft.produtos,
                      {
                        product_id: null,
                        nome: "",
                        unidade: null,
                        quantidade_aplicada: 0,
                        lote: null,
                        validade: null,
                        is_extra: true,
                      },
                    ],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Extra
              </Button>
            </div>
            <div className="space-y-3">
              {draft.produtos.map((p, idx) => {
                const setP = (patch: Partial<ExecutionProduct>) => {
                  const next = [...draft.produtos];
                  next[idx] = { ...p, ...patch };
                  update({ produtos: next });
                };
                return (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-b pb-3 last:border-0">
                    <div className="sm:col-span-5">
                      <Label className="text-xs">Produto</Label>
                      <Select
                        value={p.product_id ?? "none"}
                        onValueChange={(v) => {
                          const prod = cached.produtos.find((x) => x.id === v);
                          setP({
                            product_id: v === "none" ? null : v,
                            nome: prod?.nome ?? p.nome,
                            unidade: prod?.unidade ?? null,
                            lote: null,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Avulso —</SelectItem>
                          {cached.produtos.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id}>
                              {prod.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!p.product_id && (
                        <Input
                          className="mt-1"
                          placeholder="Nome do produto"
                          value={p.nome}
                          onChange={(e) => setP({ nome: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="sm:col-span-4">
                      <Label className="text-xs">Lote</Label>
                      <Select
                        value={p.lote ?? "none"}
                        onValueChange={(v) => {
                          const lote = lotesDoProduto(p.product_id).find(
                            (l) => l.batch_number === v,
                          );
                          setP({
                            lote: v === "none" ? null : v,
                            validade: lote?.expiry_date ?? null,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Automático" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Automático —</SelectItem>
                          {lotesDoProduto(p.product_id).map((l) => (
                            <SelectItem key={l.id} value={l.batch_number}>
                              {l.batch_number} · saldo {l.quantity_on_hand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Qtd</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={p.quantidade_aplicada || ""}
                        onChange={(e) =>
                          setP({ quantidade_aplicada: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update({ produtos: draft.produtos.filter((_, i) => i !== idx) })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {draft.produtos.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum produto registrado.</div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Fotos</h3>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => void addPhotos(e.target.files)}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Camera className="w-4 h-4 mr-2" />
              Adicionar foto
            </Button>
            <div className="mt-3 text-sm text-muted-foreground">
              {draft.fotos.length} foto(s) · {formatBytes(totalFotos)} no aparelho (comprimidas
              automaticamente)
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Cliente</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium">{cached.client?.nome}</div>
              <div className="text-muted-foreground">{cached.client?.telefone}</div>
              <div className="text-muted-foreground">{cached.client?.endereco}</div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Cache de {formatDateTime(cached.cachedAt)}
            </div>
          </Card>

          {cached.rt && (
            <Card className="p-5">
              <h3 className="font-semibold mb-2">Responsável técnico</h3>
              <div className="text-sm">{cached.rt.nome}</div>
              <div className="text-xs text-muted-foreground">
                {cached.rt.conselho} {cached.rt.registro}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Observações de campo</h3>
            <Textarea
              value={draft.observacoes_campo}
              onChange={(e) => update({ observacoes_campo: e.target.value })}
            />
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Assinatura do responsável</h3>
            <Label className="text-xs">Nome</Label>
            <Input
              className="mb-3"
              value={draft.assinaturaNome}
              onChange={(e) => update({ assinaturaNome: e.target.value })}
            />
            <SignaturePad
              value={draft.assinaturaDataUrl}
              onChange={(v) => update({ assinaturaDataUrl: v })}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
