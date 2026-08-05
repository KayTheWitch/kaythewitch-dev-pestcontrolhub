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

export const Route = createFileRoute("/_authenticated/bi/operacional")({
  head: () => ({ meta: [{ title: "BI · Operacional — Pest Control Hub" }] }),
  component: BIOperacional,
});

const OS_LABELS: Record<string, string> = {
  aguardando_execucao: "Aguardando",
  em_execucao: "Em execução",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function BIOperacional() {
  const [range, setRange] = useState<DateRange>(defaultRange());

  const { data: os } = useQuery({
    queryKey: ["bi-os", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_os_throughput", { _from: range.from, _to: range.to });
      if (error) throw error;
      return (data ?? []) as { status: string; total: number; avg_execution_hours: number }[];
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["bi-teams", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_team_productivity", { _from: range.from, _to: range.to });
      if (error) throw error;
      return (data ?? []) as { team_id: string | null; team_nome: string; os_concluidas: number; avg_field_hours: number }[];
    },
  });

  const total = os?.reduce((a, b) => a + Number(b.total), 0) ?? 0;
  const concluidas = os?.find((o) => o.status === "concluida");
  const canceladas = os?.find((o) => o.status === "cancelada")?.total ?? 0;
  const avgH = Number(concluidas?.avg_execution_hours ?? 0);

  return (
    <div>
      <PageHeader title="BI · Operacional" description="Ordens de serviço, tempo de campo e produtividade por equipe." />
      <DateRangeFilter
        value={range}
        onChange={setRange}
        onExport={() =>
          toCSV(
            [
              ...(os ?? []).map((o) => ({ grupo: "OS/status", nome: o.status, total: o.total, horas_medias: Number(o.avg_execution_hours).toFixed(2) })),
              ...(teams ?? []).map((t) => ({ grupo: "Equipe", nome: t.team_nome, total: t.os_concluidas, horas_medias: Number(t.avg_field_hours).toFixed(2) })),
            ],
            `bi-operacional-${range.from}_${range.to}.csv`,
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <KpiCard label="Total de OS" value={String(total)} />
        <KpiCard label="Concluídas" value={String(concluidas?.total ?? 0)} />
        <KpiCard label="Canceladas" value={String(canceladas)} />
        <KpiCard label="Horas médias em campo" value={`${avgH.toFixed(1)}h`} hint="Do check-in ao check-out" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">OS por status</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(os ?? []).map((o) => ({ name: OS_LABELS[o.status] ?? o.status, total: Number(o.total) }))}>
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
          <div className="text-sm font-medium mb-3">Produtividade por equipe</div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="py-2">Equipe</th>
                  <th className="py-2 text-right">Concluídas</th>
                  <th className="py-2 text-right">Horas médias</th>
                </tr>
              </thead>
              <tbody>
                {(teams ?? []).map((t) => (
                  <tr key={t.team_id ?? t.team_nome} className="border-b last:border-0">
                    <td className="py-2">{t.team_nome}</td>
                    <td className="py-2 text-right">{t.os_concluidas}</td>
                    <td className="py-2 text-right">{Number(t.avg_field_hours).toFixed(1)}h</td>
                  </tr>
                ))}
                {!teams?.length && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground text-sm">
                      Sem dados no período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
