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
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/bi/estoque")({
  head: () => ({ meta: [{ title: "BI · Estoque — Ventura" }] }),
  component: BIEstoque,
});

function BIEstoque() {
  const [range, setRange] = useState<DateRange>(defaultRange());

  const { data: critical } = useQuery({
    queryKey: ["bi-stock-critical"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_stock_critical");
      if (error) throw error;
      return (data ?? []) as {
        product_id: string;
        produto: string;
        saldo: number;
        min_stock: number;
        vencendo_30: number;
        vencendo_60: number;
        vencendo_90: number;
      }[];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["bi-suppliers", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_supplier_performance", {
        _from: range.from,
        _to: range.to,
      });
      if (error) throw error;
      return (data ?? []) as {
        supplier_id: string;
        fornecedor: string;
        pedidos: number;
        total_comprado: number;
        lead_time_medio_dias: number;
      }[];
    },
  });

  const abaixoMinimo = critical?.filter((p) => Number(p.saldo) < Number(p.min_stock)) ?? [];
  const vencendo30 = critical?.reduce((a, b) => a + Number(b.vencendo_30), 0) ?? 0;
  const totalComprado = suppliers?.reduce((a, b) => a + Number(b.total_comprado), 0) ?? 0;

  return (
    <div>
      <PageHeader title="BI · Estoque e Compras" description="Itens críticos, vencimentos e desempenho de fornecedores." />
      <DateRangeFilter
        value={range}
        onChange={setRange}
        onExport={() =>
          toCSV(
            [
              ...(critical ?? []).map((c) => ({ tipo: "produto", nome: c.produto, saldo: c.saldo, min: c.min_stock, venc30: c.vencendo_30, venc60: c.vencendo_60, venc90: c.vencendo_90 })),
              ...(suppliers ?? []).map((s) => ({ tipo: "fornecedor", nome: s.fornecedor, saldo: "", min: "", venc30: s.pedidos, venc60: s.total_comprado, venc90: s.lead_time_medio_dias })),
            ],
            `bi-estoque-${range.from}_${range.to}.csv`,
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Itens abaixo do mínimo" value={String(abaixoMinimo.length)} />
        <KpiCard label="Vencendo em 30 dias" value={vencendo30.toFixed(0)} hint="Somatório de quantidades" />
        <KpiCard label="Comprado no período" value={formatCurrency(totalComprado)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">Produtos abaixo do mínimo</div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="py-2">Produto</th>
                  <th className="py-2 text-right">Saldo</th>
                  <th className="py-2 text-right">Mínimo</th>
                  <th className="py-2 text-right">Venc 30d</th>
                </tr>
              </thead>
              <tbody>
                {abaixoMinimo.map((p) => (
                  <tr key={p.product_id} className="border-b last:border-0">
                    <td className="py-2">{p.produto}</td>
                    <td className="py-2 text-right">{Number(p.saldo).toFixed(0)}</td>
                    <td className="py-2 text-right">{Number(p.min_stock).toFixed(0)}</td>
                    <td className="py-2 text-right">{Number(p.vencendo_30).toFixed(0)}</td>
                  </tr>
                ))}
                {!abaixoMinimo.length && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">
                      Nenhum item crítico
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium mb-3">Compras por fornecedor</div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="py-2">Fornecedor</th>
                  <th className="py-2 text-right">Pedidos</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Lead time</th>
                </tr>
              </thead>
              <tbody>
                {(suppliers ?? []).map((s) => (
                  <tr key={s.supplier_id} className="border-b last:border-0">
                    <td className="py-2">{s.fornecedor}</td>
                    <td className="py-2 text-right">{s.pedidos}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(s.total_comprado))}</td>
                    <td className="py-2 text-right">{Number(s.lead_time_medio_dias).toFixed(1)}d</td>
                  </tr>
                ))}
                {!suppliers?.length && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">
                      Sem compras no período
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
