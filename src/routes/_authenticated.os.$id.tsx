import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft, Printer, Save } from "lucide-react";
import { formatDate, OS_STATUS_LABEL } from "@/lib/format";
import { OsStatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/os/$id")({
  component: OsDetail,
});

function OsDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: os } = useQuery({
    queryKey: ["os", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*, clients(*), teams(id, nome)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("id, nome")
        .eq("ativo", true);
      return data ?? [];
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (os && !form) {
      setForm({
        data_prevista: os.data_prevista ?? "",
        team_id: os.team_id ?? "",
        responsavel: os.responsavel ?? "",
        instrucoes: os.instrucoes ?? "",
        observacoes: os.observacoes ?? "",
        status: os.status,
        checklist: os.checklist ?? [],
      });
    }
  }, [os, form]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("service_orders")
        .update({
          data_prevista: form.data_prevista || null,
          team_id: form.team_id || null,
          responsavel: form.responsavel,
          instrucoes: form.instrucoes,
          observacoes: form.observacoes,
          status: form.status,
          checklist: form.checklist,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("OS atualizada");
      qc.invalidateQueries({ queryKey: ["os", id] });
      qc.invalidateQueries({ queryKey: ["os-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!os || !form) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
        <Link to="/os">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
      </Button>
      <PageHeader
        title={`OS #${os.numero}`}
        description={os.clients?.nome}
        actions={
          <div className="flex items-center gap-2">
            <OsStatusBadge status={form.status} />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            {os.public_token && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/r/${os.public_token}`} target="_blank" rel="noreferrer">
                  Relatório
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/os/$id/campo" params={{ id }}>
                Executar em campo
              </Link>
            </Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>

          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Agendamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data prevista</Label>
                <Input
                  type="date"
                  value={form.data_prevista || ""}
                  onChange={(e) =>
                    setForm({ ...form, data_prevista: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OS_STATUS_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipe</Label>
                <Select
                  value={form.team_id || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, team_id: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhuma —</SelectItem>
                    {teams.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável no local</Label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-4">Checklist técnico</h3>
            <div className="space-y-2">
              {(form.checklist as any[]).map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                >
                  <Checkbox
                    checked={item.ok}
                    onCheckedChange={(v) => {
                      const next = [...form.checklist];
                      next[idx] = { ...item, ok: !!v };
                      setForm({ ...form, checklist: next });
                    }}
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-4">Produtos previstos</h3>
            <div className="space-y-1 text-sm">
              {((os.produtos_previstos as any[]) ?? []).map((it: any, i: number) => (
                <div key={i} className="flex justify-between border-b py-2 last:border-0">
                  <span>{it.nome}</span>
                  <span className="text-muted-foreground">Qtd {it.quantidade}</span>
                </div>
              ))}
              {(!os.produtos_previstos || (os.produtos_previstos as any[]).length === 0) && (
                <div className="text-muted-foreground">Nenhum produto previsto.</div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Instruções e observações</h3>
            <div className="space-y-3">
              <div>
                <Label>Instruções técnicas</Label>
                <Textarea
                  value={form.instrucoes}
                  onChange={(e) => setForm({ ...form, instrucoes: e.target.value })}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Cliente</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium">{os.clients?.nome}</div>
              <div className="text-muted-foreground">{os.clients?.telefone}</div>
              <div className="text-muted-foreground">{os.clients?.endereco}</div>
              <div className="text-muted-foreground">
                {os.clients?.cidade}
                {os.clients?.estado && `/${os.clients?.estado}`}
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Referências</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Criada: {formatDate(os.created_at)}</div>
              {os.proposal_id && (
                <div>
                  <Link
                    to="/propostas/$id"
                    params={{ id: os.proposal_id }}
                    className="text-primary hover:underline"
                  >
                    Ver proposta origem
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
