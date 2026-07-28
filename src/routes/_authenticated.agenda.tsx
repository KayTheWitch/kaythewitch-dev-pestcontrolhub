import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OsStatusBadge } from "@/components/StatusBadge";
import { ChevronLeft, ChevronRight, CalendarPlus, Ban } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

function AgendaPage() {
  const qc = useQueryClient();
  const [semana, setSemana] = useState(() => startOfWeek(new Date()));
  const [equipe, setEquipe] = useState<string>("todas");
  const [reagendar, setReagendar] = useState<any>(null);
  const [openBloqueio, setOpenBloqueio] = useState(false);

  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(semana.getTime() + i * 86400000)),
    [semana],
  );
  const inicio = iso(dias[0]);
  const fim = iso(dias[6]);

  const { data: equipes = [] } = useQuery({
    queryKey: ["teams", "ativas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      return data ?? [];
    },
  });

  const { data: ordens = [] } = useQuery({
    queryKey: ["agenda-os", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, numero, status, data_prevista, responsavel, team_id, clients(nome, cidade), teams(nome)")
        .gte("data_prevista", inicio)
        .lte("data_prevista", fim)
        .order("numero");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: bloqueios = [] } = useQuery({
    queryKey: ["schedule_blocks", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*, teams(nome)")
        .gte("starts_at", `${inicio}T00:00:00`)
        .lte("starts_at", `${fim}T23:59:59`)
        .order("starts_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtradas = (ordens as any[]).filter(
    (o) => equipe === "todas" || o.team_id === equipe,
  );

  const mover = useMutation({
    mutationFn: async ({ id, data_prevista, team_id }: any) => {
      const { error } = await supabase
        .from("service_orders")
        .update({ data_prevista, ...(team_id !== undefined ? { team_id } : {}) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agenda atualizada");
      qc.invalidateQueries({ queryKey: ["agenda-os"] });
      setReagendar(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const criarBloqueio = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("schedule_blocks").insert({
        team_id: v.team_id || null,
        starts_at: v.starts_at,
        ends_at: v.ends_at,
        reason: v.reason,
        notes: v.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio registrado");
      qc.invalidateQueries({ queryKey: ["schedule_blocks"] });
      setOpenBloqueio(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removerBloqueio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule_blocks"] }),
  });

  const semAgenda = useQuery({
    queryKey: ["os-sem-data"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("id, numero, status, clients(nome)")
        .is("data_prevista", null)
        .in("status", ["aguardando_execucao", "em_deslocamento", "em_execucao"])
        .order("numero");
      return data ?? [];
    },
  });

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Programação semanal das ordens de serviço por equipe e bloqueios de disponibilidade."
        actions={
          <Dialog open={openBloqueio} onOpenChange={setOpenBloqueio}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Ban className="w-4 h-4 mr-2" /> Bloqueio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo bloqueio de agenda</DialogTitle>
              </DialogHeader>
              <BloqueioForm
                equipes={equipes as any[]}
                submitting={criarBloqueio.isPending}
                onSubmit={(v) => criarBloqueio.mutate(v)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSemana(new Date(semana.getTime() - 7 * 86400000))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSemana(startOfWeek(new Date()))}>
          Hoje
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSemana(new Date(semana.getTime() + 7 * 86400000))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="text-sm text-muted-foreground">
          {dias[0].toLocaleDateString("pt-BR")} — {dias[6].toLocaleDateString("pt-BR")}
        </div>
        <div className="ml-auto w-56">
          <Select value={equipe} onValueChange={setEquipe}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as equipes</SelectItem>
              {(equipes as any[]).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {dias.map((d) => {
          const key = iso(d);
          const doDia = filtradas.filter((o) => o.data_prevista === key);
          const hoje = iso(new Date()) === key;
          return (
            <Card key={key} className={`p-3 min-h-40 ${hoje ? "ring-1 ring-primary" : ""}`}>
              <div className="text-xs font-semibold mb-2">
                {DIAS[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}
              </div>
              <div className="space-y-2">
                {doDia.map((o: any) => (
                  <div key={o.id} className="rounded-md border p-2 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        to="/os/$id"
                        params={{ id: o.id }}
                        className="font-medium hover:underline"
                      >
                        OS #{o.numero}
                      </Link>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setReagendar(o)}
                        title="Reagendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-muted-foreground truncate">{o.clients?.nome}</div>
                    {o.teams?.nome && (
                      <div className="text-muted-foreground truncate">{o.teams.nome}</div>
                    )}
                    <OsStatusBadge status={o.status} />
                  </div>
                ))}
                {doDia.length === 0 && (
                  <div className="text-xs text-muted-foreground">Sem OS</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-3">OS sem data prevista</h2>
          <div className="space-y-2">
            {(semAgenda.data ?? []).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <Link to="/os/$id" params={{ id: o.id }} className="font-medium hover:underline">
                    OS #{o.numero}
                  </Link>
                  <div className="text-xs text-muted-foreground">{o.clients?.nome}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setReagendar(o)}>
                  Agendar
                </Button>
              </div>
            ))}
            {(semAgenda.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Todas as OS abertas estão agendadas.</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-3">Bloqueios da semana</h2>
          <div className="space-y-2">
            {(bloqueios as any[]).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">{b.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(b.starts_at)} — {formatDateTime(b.ends_at)}
                    {b.teams?.nome ? ` · ${b.teams.nome}` : " · Todas as equipes"}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removerBloqueio.mutate(b.id)}>
                  Remover
                </Button>
              </div>
            ))}
            {bloqueios.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum bloqueio nesta semana.</p>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={!!reagendar} onOpenChange={(o) => !o && setReagendar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar OS #{reagendar?.numero}</DialogTitle>
          </DialogHeader>
          {reagendar && (
            <ReagendarForm
              os={reagendar}
              equipes={equipes as any[]}
              submitting={mover.isPending}
              onSubmit={(v) => mover.mutate({ id: reagendar.id, ...v })}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReagendarForm({
  os,
  equipes,
  onSubmit,
  submitting,
}: {
  os: any;
  equipes: any[];
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [data, setData] = useState(os.data_prevista ?? new Date().toISOString().slice(0, 10));
  const [team, setTeam] = useState(os.team_id ?? "sem");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ data_prevista: data, team_id: team === "sem" ? null : team });
      }}
    >
      <div>
        <Label>Data prevista</Label>
        <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>
      <div>
        <Label>Equipe</Label>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sem">Sem equipe</SelectItem>
            {equipes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}

function BloqueioForm({
  equipes,
  onSubmit,
  submitting,
}: {
  equipes: any[];
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const agora = new Date().toISOString().slice(0, 16);
  const [v, setV] = useState<any>({
    team_id: "",
    starts_at: agora,
    ends_at: agora,
    reason: "",
    notes: "",
  });
  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.reason) {
          toast.error("Informe o motivo");
          return;
        }
        onSubmit({ ...v, team_id: v.team_id === "todas" ? "" : v.team_id });
      }}
    >
      <div>
        <Label>Equipe</Label>
        <Select value={v.team_id || "todas"} onValueChange={(val) => set("team_id", val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as equipes</SelectItem>
            {equipes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Início</Label>
          <Input
            type="datetime-local"
            value={v.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
          />
        </div>
        <div>
          <Label>Fim</Label>
          <Input
            type="datetime-local"
            value={v.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Motivo</Label>
        <Input value={v.reason} onChange={(e) => set("reason", e.target.value)} />
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          Registrar bloqueio
        </Button>
      </DialogFooter>
    </form>
  );
}
