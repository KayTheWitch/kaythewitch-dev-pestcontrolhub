import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  ClipboardList,
  TrendingUp,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ProposalStatusBadge, LeadStatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [clients, leads, proposals, os] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id, status", { count: "exact" }),
        supabase.from("proposals").select("id, status, total, created_at, client_id, clients(nome)").order("created_at", { ascending: false }),
        supabase.from("service_orders").select("id, status", { count: "exact" }),
      ]);
      const proposalRows = proposals.data ?? [];
      const approved = proposalRows.filter((p) => p.status === "aprovada");
      const totalGanho = approved.reduce((s, p) => s + Number(p.total || 0), 0);
      const ticket = approved.length ? totalGanho / approved.length : 0;
      const conversao = proposalRows.length
        ? (approved.length / proposalRows.length) * 100
        : 0;
      const funnel: Record<string, number> = {};
      for (const p of proposalRows) funnel[p.status] = (funnel[p.status] ?? 0) + 1;
      const leadsFunnel: Record<string, number> = {};
      for (const l of leads.data ?? []) leadsFunnel[l.status] = (leadsFunnel[l.status] ?? 0) + 1;
      return {
        clientsCount: clients.count ?? 0,
        leadsCount: leads.count ?? 0,
        osCount: os.count ?? 0,
        proposalsCount: proposalRows.length,
        approvedCount: approved.length,
        totalGanho,
        ticket,
        conversao,
        funnel,
        leadsFunnel,
        recent: proposalRows.slice(0, 5),
      };
    },
  });

  const kpis = [
    { label: "Leads ativos", value: data?.leadsCount ?? 0, icon: UserPlus, to: "/leads" },
    { label: "Clientes", value: data?.clientsCount ?? 0, icon: Users, to: "/clientes" },
    { label: "Propostas", value: data?.proposalsCount ?? 0, icon: FileText, to: "/propostas" },
    { label: "Ordens de serviço", value: data?.osCount ?? 0, icon: ClipboardList, to: "/os" },
  ];

  return (
    <>
      <PageHeader
        title="Painel comercial"
        description="Acompanhe o funil de vendas, propostas em andamento e resultados do mês."
        actions={
          <Button asChild>
            <Link to="/leads">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo lead
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link key={k.label} to={k.to}>
              <Card className="p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-semibold">{k.value}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Conversão</span>
          </div>
          <div className="text-2xl font-semibold">
            {(data?.conversao ?? 0).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {data?.approvedCount ?? 0} propostas aprovadas de{" "}
            {data?.proposalsCount ?? 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium mb-1">Ticket médio</div>
          <div className="text-2xl font-semibold">{formatCurrency(data?.ticket ?? 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">Propostas aprovadas</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium mb-1">Receita fechada</div>
          <div className="text-2xl font-semibold">
            {formatCurrency(data?.totalGanho ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Soma das propostas aprovadas</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Funil de propostas</h3>
          </div>
          <div className="space-y-2">
            {["rascunho", "enviada", "em_assinatura", "aprovada", "recusada", "expirada"].map(
              (s) => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <ProposalStatusBadge status={s} />
                  <span className="font-medium">{data?.funnel[s] ?? 0}</span>
                </div>
              ),
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Últimas propostas</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/propostas">
                Ver todas <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {(data?.recent ?? []).map((p: any) => (
              <Link
                key={p.id}
                to="/propostas/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {p.clients?.nome ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(p.created_at)} · {formatCurrency(p.total)}
                  </div>
                </div>
                <ProposalStatusBadge status={p.status} />
              </Link>
            ))}
            {(!data?.recent || data.recent.length === 0) && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Nenhuma proposta ainda. Comece cadastrando um lead.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-4">
        <h3 className="font-semibold mb-3">Funil de leads</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {["novo", "em_diagnostico", "proposta_enviada", "ganho", "perdido"].map((s) => (
            <div key={s} className="p-3 rounded-md border bg-card">
              <LeadStatusBadge status={s} />
              <div className="text-2xl font-semibold mt-2">
                {data?.leadsFunnel[s] ?? 0}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
