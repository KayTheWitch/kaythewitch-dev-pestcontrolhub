import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { CATEGORY_LABEL, SERVICE_TYPE_LABEL } from "@/lib/format";

const searchSchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/diagnosticos/novo")({
  validateSearch: searchSchema,
  component: DiagnosticoNovo,
});

function DiagnosticoNovo() {
  const { leadId, clientId } = Route.useSearch();
  const router = useRouter();

  const { data: lead } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
      return data;
    },
    enabled: !!leadId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, nome")
        .order("nome");
      return data ?? [];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["service-catalog-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    client_id: clientId ?? "",
    tipo_servico: "controle_pragas",
    praga_necessidade: "",
    area_m2: "",
    volume_l: "",
    periodicidade: "unica",
    urgencia: "media",
    classificacao: "residencial",
    precisa_visita: false,
    observacoes: "",
  });
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [margemPct, setMargemPct] = useState("15");

  useEffect(() => {
    if (lead && lead.client_id && !form.client_id) {
      setForm((f) => ({ ...f, client_id: lead.client_id }));
    }
  }, [lead, form.client_id]);

  const create = useMutation({
    mutationFn: async () => {
      if (!form.client_id) throw new Error("Selecione o cliente");
      const items = services
        .filter((s: any) => selectedServices[s.id] > 0)
        .map((s: any) => ({
          service_id: s.id,
          nome: s.nome,
          preco_base: Number(s.preco_base),
          quantidade: selectedServices[s.id],
          subtotal: Number(s.preco_base) * selectedServices[s.id],
        }));
      if (items.length === 0) throw new Error("Adicione ao menos um serviço");
      const subtotal = items.reduce((s: number, i: any) => s + i.subtotal, 0);
      const margem = Number(margemPct) || 0;
      const total = subtotal * (1 + margem / 100);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: diag, error: derr } = await supabase
        .from("diagnostics")
        .insert({
          lead_id: leadId ?? null,
          client_id: form.client_id,
          tipo_servico: form.tipo_servico as any,
          praga_necessidade: form.praga_necessidade,
          area_m2: form.area_m2 ? Number(form.area_m2) : null,
          volume_l: form.volume_l ? Number(form.volume_l) : null,
          periodicidade: form.periodicidade,
          urgencia: form.urgencia as any,
          classificacao: form.classificacao as any,
          precisa_visita: form.precisa_visita,
          observacoes: form.observacoes,
          created_by: user?.id,
        })
        .select()
        .single();
      if (derr) throw derr;

      const { data: prop, error: perr } = await supabase
        .from("proposals")
        .insert({
          diagnostic_id: diag.id,
          client_id: form.client_id,
          itens: items,
          subtotal,
          margem_pct: margem,
          total,
          status: "rascunho",
          created_by: user?.id,
        })
        .select()
        .single();
      if (perr) throw perr;

      if (leadId) {
        await supabase
          .from("leads")
          .update({ status: "proposta_enviada" })
          .eq("id", leadId);
      }
      return prop;
    },
    onSuccess: (prop) => {
      toast.success("Diagnóstico salvo e proposta criada");
      router.navigate({ to: "/propostas/$id", params: { id: prop.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredServices = services.filter((s: any) => s.tipo === form.tipo_servico);
  const subtotal = filteredServices.reduce(
    (sum: number, s: any) => sum + (selectedServices[s.id] ?? 0) * Number(s.preco_base),
    0,
  );
  const margem = Number(margemPct) || 0;
  const total = subtotal * (1 + margem / 100);

  return (
    <>
      <PageHeader
        title="Novo diagnóstico"
        description="Registre o problema, dimensione e monte a proposta comercial."
      />

      <Card className="p-6 mb-4">
        <h3 className="font-semibold mb-4">1. Cliente e classificação</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cliente *</Label>
            <Select
              value={form.client_id}
              onValueChange={(v) => setForm({ ...form, client_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Classificação</Label>
            <Select
              value={form.classificacao}
              onValueChange={(v) => setForm({ ...form, classificacao: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h3 className="font-semibold mb-4">2. Tipo de serviço</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Serviço</Label>
            <Select
              value={form.tipo_servico}
              onValueChange={(v) => {
                setForm({ ...form, tipo_servico: v });
                setSelectedServices({});
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_TYPE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Urgência</Label>
            <Select
              value={form.urgencia}
              onValueChange={(v) => setForm({ ...form, urgencia: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Praga / necessidade</Label>
            <Input
              value={form.praga_necessidade}
              onChange={(e) => setForm({ ...form, praga_necessidade: e.target.value })}
              placeholder="Ex.: baratas, ratos, higienização"
            />
          </div>
          <div>
            <Label>Periodicidade</Label>
            <Select
              value={form.periodicidade}
              onValueChange={(v) => setForm({ ...form, periodicidade: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unica">Única</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.tipo_servico === "controle_pragas" ? (
            <div>
              <Label>Área (m²)</Label>
              <Input
                type="number"
                value={form.area_m2}
                onChange={(e) => setForm({ ...form, area_m2: e.target.value })}
              />
            </div>
          ) : (
            <div>
              <Label>Volume do reservatório (L)</Label>
              <Input
                type="number"
                value={form.volume_l}
                onChange={(e) => setForm({ ...form, volume_l: e.target.value })}
              />
            </div>
          )}
          <div className="flex items-center gap-2 pt-6">
            <Checkbox
              id="visita"
              checked={form.precisa_visita}
              onCheckedChange={(v) => setForm({ ...form, precisa_visita: !!v })}
            />
            <Label htmlFor="visita" className="cursor-pointer">
              Requer visita técnica
            </Label>
          </div>
        </div>
        <div className="mt-4">
          <Label>Observações</Label>
          <Textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          />
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h3 className="font-semibold mb-4">3. Itens da proposta</h3>
        <div className="space-y-2">
          {filteredServices.map((s: any) => (
            <div
              key={s.id}
              className="flex items-center gap-3 p-3 rounded-md border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{s.nome}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {s.descricao}
                </div>
              </div>
              <div className="text-sm text-muted-foreground w-28 text-right">
                R$ {Number(s.preco_base).toFixed(2)} / {s.unidade}
              </div>
              <Input
                type="number"
                min={0}
                value={selectedServices[s.id] ?? 0}
                onChange={(e) =>
                  setSelectedServices({
                    ...selectedServices,
                    [s.id]: Number(e.target.value),
                  })
                }
                className="w-20"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h3 className="font-semibold mb-4">4. Precificação</h3>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <Label>Subtotal</Label>
            <div className="text-lg font-semibold py-2">
              R$ {subtotal.toFixed(2)}
            </div>
          </div>
          <div>
            <Label>Margem (%)</Label>
            <Input
              type="number"
              value={margemPct}
              onChange={(e) => setMargemPct(e.target.value)}
            />
          </div>
          <div>
            <Label>Total</Label>
            <div className="text-2xl font-semibold text-primary py-2">
              R$ {total.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.history.back()}>
          Cancelar
        </Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? "Salvando..." : "Salvar e gerar proposta"}
        </Button>
      </div>
    </>
  );
}
