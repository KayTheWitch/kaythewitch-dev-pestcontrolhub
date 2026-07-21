import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import {
  DateRangeFilter,
  KpiCard,
  defaultRange,
  toCSV,
  type DateRange,
} from "@/components/bi/DateRangeFilter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/bi/comercial")({
  head: () => ({ meta: [{ title: "BI · Comercial — Ventura" }] }),
  component: BIComercial,
});

const LEAD_LABELS: Record<string, string> = {
  novo: "Novo",
  em_diagnostico: "Em diagnóstico",
  proposta_enviada: "Proposta enviada",
  ganho: "Ganho",
  perdido: "Perdido",
};

const PROP_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  em_assinatura: "Em assinatura",
  aprovada: "Aprovada",
  recusada: "Recusada",
  expirada: "Expirada",
};

function BIComercial() {
  const [range, setRange] = useState<DateRange>(defaultRange());

  const { data: funnel } = useQuery({
    queryKey: ["bi-funnel", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_lead_funnel", { _from: range.from, _to: range.to });
      if (error) throw error;
      return (data ?? []) as { status: string; total: number }[];
    },
  });

  const { data: props } = useQuery({
    queryKey: ["bi-props", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_proposal_metrics", { _from: range.from, _to: range.to });
      if (error) throw error;
      return (data ?? []) as { status: string; total: number; valor_total: number; ticket_medio: number }[];
    },
  });

  const totalLeads = funnel?.reduce((a, b) => a + Number(b.total), 0) ?? 0;
  const ganhos = funnel?.find((f) => f.status === "ganho")?.total ?? 0;
  const conv = totalLeads > 0 ? (Number(ganhos) / totalLeads) * 100 : 0;

  const aprovadas = props?.find((p) => p.status === "aprovada");
  const totalProp = props?.reduce((a, b) => a + Number(b.total), 0) ?? 0;
  const valorAprovado = Number(aprovadas?.valor_total ?? 0);
  const ticket = Number(aprovadas?.ticket_medio ?? 0);

  return (
    <div>
      <PageHeader title="BI · Comercial" description="Funil de leads e desempenho de propostas." />
      <DateRangeFilter
        value={range}
        onChange={setRange}
        onExport={() =>
          toCSV(
            [
              ...(funnel ?? []).map((f) => ({ tipo: "lead", categoria: f.status, total: f.total, valor: "" })),
              ...(props ?? []).map((p) => ({ tipo: "proposta", categoria: p.status, total: p.total, valor: p.valor_total })),
            ],
            `bi-comercial-${range.from}_${range.to}.csv`,
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <KpiCard label="Leads" value={String(totalLeads)} />
        <KpiCard label="Taxa de conversão" value={`${conv.toFixed(1)}%`} hint={`${ganhos} ganhos`} />
        <KpiCard label="Propostas" value={String(totalProp)} hint={`${aprovadas?.total ?? 0} aprovadas`} />
        <KpiCard label="Ticket médio (aprovadas)" value={formatCurrency(ticket)} hint={formatCurrency(valorAprovado) + " aprovado"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">Funil de leads</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(funnel ?? []).map((f) => ({ name: LEAD_LABELS[f.status] ?? f.status, total: Number(f.total) }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium mb-3">Propostas por status</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(props ?? []).map((p) => ({ name: PROP_LABELS[p.status] ?? p.status, total: Number(p.total), valor: Number(p.valor_total) }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number, k) => (k === "valor" ? formatCurrency(v) : v)} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
