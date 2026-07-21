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
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/bi/financeiro")({
  head: () => ({ meta: [{ title: "BI · Financeiro — Ventura" }] }),
  component: BIFinanceiro,
});

const BUCKET_LABEL: Record<string, string> = {
  a_vencer: "A vencer",
  "1-30": "1-30 dias",
  "31-60": "31-60 dias",
  "61-90": "61-90 dias",
  "90+": "90+ dias",
};

function BIFinanceiro() {
  const [range, setRange] = useState<DateRange>(defaultRange());

  const { data: dre } = useQuery({
    queryKey: ["bi-dre", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_financial_dre", { _from: range.from, _to: range.to });
      if (error) throw error;
      return (data ?? []) as { mes: string; receita: number; despesa: number; resultado: number }[];
    },
  });

  const { data: ar } = useQuery({
    queryKey: ["bi-ar-aging"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_receivables_aging");
      if (error) throw error;
      return (data ?? []) as { bucket: string; total: number; valor: number }[];
    },
  });

  const { data: ap } = useQuery({
    queryKey: ["bi-ap-aging"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_payables_aging");
      if (error) throw error;
      return (data ?? []) as { bucket: string; total: number; valor: number }[];
    },
  });

  const receita = dre?.reduce((a, b) => a + Number(b.receita), 0) ?? 0;
  const despesa = dre?.reduce((a, b) => a + Number(b.despesa), 0) ?? 0;
  const resultado = receita - despesa;
  const arTotal = ar?.reduce((a, b) => a + Number(b.valor), 0) ?? 0;
  const apTotal = ap?.reduce((a, b) => a + Number(b.valor), 0) ?? 0;

  return (
    <div>
      <PageHeader title="BI · Financeiro" description="Resultado mensal e aging dos títulos." />
      <DateRangeFilter
        value={range}
        onChange={setRange}
        onExport={() =>
          toCSV(
            [
              ...(dre ?? []).map((d) => ({ tipo: "dre", chave: String(d.mes), receita: d.receita, despesa: d.despesa, resultado: d.resultado })),
              ...(ar ?? []).map((a) => ({ tipo: "receber", chave: a.bucket, receita: a.valor, despesa: "", resultado: a.total })),
              ...(ap ?? []).map((a) => ({ tipo: "pagar", chave: a.bucket, receita: "", despesa: a.valor, resultado: a.total })),
            ],
            `bi-financeiro-${range.from}_${range.to}.csv`,
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <KpiCard label="Receita realizada" value={formatCurrency(receita)} />
        <KpiCard label="Despesa realizada" value={formatCurrency(despesa)} />
        <KpiCard label="Resultado" value={formatCurrency(resultado)} hint={resultado >= 0 ? "Superávit" : "Déficit"} />
        <KpiCard label="Aberto (receber − pagar)" value={formatCurrency(arTotal - apTotal)} hint={`${formatCurrency(arTotal)} a receber`} />
      </div>

      <Card className="p-4 mb-4">
        <div className="text-sm font-medium mb-3">DRE mensal</div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart
              data={(dre ?? []).map((d) => ({
                mes: new Date(d.mes).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
                Receita: Number(d.receita),
                Despesa: Number(d.despesa),
                Resultado: Number(d.resultado),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} width={90} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Receita" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesa" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resultado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <AgingCard title="Aging — Contas a receber" data={ar ?? []} />
        <AgingCard title="Aging — Contas a pagar" data={ap ?? []} />
      </div>
    </div>
  );
}

function AgingCard({ title, data }: { title: string; data: { bucket: string; total: number; valor: number }[] }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground border-b">
            <th className="py-2">Faixa</th>
            <th className="py-2 text-right">Títulos</th>
            <th className="py-2 text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.bucket} className="border-b last:border-0">
              <td className="py-2">{BUCKET_LABEL[d.bucket] ?? d.bucket}</td>
              <td className="py-2 text-right">{d.total}</td>
              <td className="py-2 text-right">{formatCurrency(Number(d.valor))}</td>
            </tr>
          ))}
          {!data.length && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-muted-foreground text-sm">
                Sem títulos em aberto
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
