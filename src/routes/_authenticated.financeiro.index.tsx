import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { FinancialStatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/financeiro/")({
  component: FinanceiroDashboard,
});

function FinanceiroDashboard() {
  const { data } = useQuery({
    queryKey: ["fin-dashboard"],
    queryFn: async () => {
      // atualiza vencidos on-demand
      await supabase.rpc("refresh_overdue_accounts");

      const [ar, ap, payments] = await Promise.all([
        supabase
          .from("accounts_receivable")
          .select("id, numero, descricao, valor_original, valor_pago, data_vencimento, status, clients(nome)")
          .order("data_vencimento", { ascending: true }),
        supabase
          .from("accounts_payable")
          .select("id, numero, descricao, valor_original, valor_pago, data_vencimento, status, suppliers(nome)")
          .order("data_vencimento", { ascending: true }),
        supabase
          .from("financial_payments")
          .select("tipo, valor, data_pagamento")
          .gte("data_pagamento", firstOfMonth(new Date(Date.now() - 60 * 24 * 3600 * 1000))),
      ]);

      const arRows = ar.data ?? [];
      const apRows = ap.data ?? [];
      const payRows = payments.data ?? [];

      const openAr = arRows.filter((r) => r.status !== "pago" && r.status !== "cancelado");
      const openAp = apRows.filter((r) => r.status !== "pago" && r.status !== "cancelado");

      const saldoReceber = openAr.reduce(
        (s, r) => s + (Number(r.valor_original) - Number(r.valor_pago)),
        0,
      );
      const saldoPagar = openAp.reduce(
        (s, r) => s + (Number(r.valor_original) - Number(r.valor_pago)),
        0,
      );

      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const proxRec = openAr
        .filter((r) => new Date(r.data_vencimento) <= in30)
        .reduce((s, r) => s + (Number(r.valor_original) - Number(r.valor_pago)), 0);
      const proxPag = openAp
        .filter((r) => new Date(r.data_vencimento) <= in30)
        .reduce((s, r) => s + (Number(r.valor_original) - Number(r.valor_pago)), 0);

      const vencidosAr = openAr.filter((r) => r.status === "vencido");
      const vencidosAp = openAp.filter((r) => r.status === "vencido");

      // fluxo por mês
      const bucket: Record<string, { in: number; out: number }> = {};
      for (const p of payRows) {
        const k = (p.data_pagamento as string).slice(0, 7);
        bucket[k] ??= { in: 0, out: 0 };
        if (p.tipo === "receber") bucket[k].in += Number(p.valor);
        else bucket[k].out += Number(p.valor);
      }
      const meses = Object.keys(bucket).sort().slice(-3);

      return {
        saldoReceber,
        saldoPagar,
        saldoLiquido: proxRec - proxPag,
        vencidosAr,
        vencidosAp,
        proximosVencerAr: openAr.slice(0, 5),
        proximosVencerAp: openAp.slice(0, 5),
        fluxo: meses.map((m) => ({ mes: m, ...bucket[m] })),
      };
    },
  });

  return (
    <>
      <PageHeader
        title="Painel financeiro"
        description="Fluxo de caixa, contas a receber e pagar, e alertas de vencimento."
        actions={
          <Button asChild>
            <Link to="/financeiro/lancamento/novo">
              <Plus className="w-4 h-4 mr-2" />
              Novo lançamento
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          label="A receber"
          value={formatCurrency(data?.saldoReceber ?? 0)}
          icon={ArrowDownCircle}
          to="/financeiro/receber"
          tone="success"
        />
        <Kpi
          label="A pagar"
          value={formatCurrency(data?.saldoPagar ?? 0)}
          icon={ArrowUpCircle}
          to="/financeiro/pagar"
          tone="destructive"
        />
        <Kpi
          label="Saldo previsto 30d"
          value={formatCurrency(data?.saldoLiquido ?? 0)}
          icon={Wallet}
          to="/financeiro"
        />
        <Kpi
          label="Vencidos"
          value={`${(data?.vencidosAr.length ?? 0) + (data?.vencidosAp.length ?? 0)}`}
          icon={AlertTriangle}
          to="/financeiro"
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-success" />
            Próximos recebimentos
          </h3>
          <div className="space-y-2">
            {(data?.proximosVencerAr ?? []).map((r: any) => (
              <Link
                key={r.id}
                to="/financeiro/receber/$id"
                params={{ id: r.id }}
                className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.clients?.nome ?? r.descricao}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.numero} · vence {formatDate(r.data_vencimento)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatCurrency(Number(r.valor_original) - Number(r.valor_pago))}
                  </div>
                  <FinancialStatusBadge status={r.status} />
                </div>
              </Link>
            ))}
            {!data?.proximosVencerAr.length && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhuma conta a receber em aberto.
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild className="mt-3 w-full">
            <Link to="/financeiro/receber">
              Ver todas <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-destructive" />
            Próximos pagamentos
          </h3>
          <div className="space-y-2">
            {(data?.proximosVencerAp ?? []).map((r: any) => (
              <Link
                key={r.id}
                to="/financeiro/pagar/$id"
                params={{ id: r.id }}
                className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.suppliers?.nome ?? r.descricao}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.numero} · vence {formatDate(r.data_vencimento)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatCurrency(Number(r.valor_original) - Number(r.valor_pago))}
                  </div>
                  <FinancialStatusBadge status={r.status} />
                </div>
              </Link>
            ))}
            {!data?.proximosVencerAp.length && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhuma conta a pagar em aberto.
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild className="mt-3 w-full">
            <Link to="/financeiro/pagar">
              Ver todas <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Fluxo de caixa realizado (últimos meses)</h3>
        {data?.fluxo.length ? (
          <div className="space-y-3">
            {data.fluxo.map((f) => (
              <div key={f.mes} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{monthLabel(f.mes)}</span>
                  <span
                    className={
                      f.in - f.out >= 0 ? "text-success font-medium" : "text-destructive font-medium"
                    }
                  >
                    {formatCurrency(f.in - f.out)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-muted-foreground">
                    Entradas: <span className="text-success">{formatCurrency(f.in)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Saídas: <span className="text-destructive">{formatCurrency(f.out)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            Sem movimentações registradas.
          </div>
        )}
      </Card>
    </>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  to,
  tone,
}: {
  label: string;
  value: string;
  icon: any;
  to: string;
  tone?: "success" | "destructive" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "warning"
          ? "text-warning"
          : "text-muted-foreground";
  return (
    <Link to={to}>
      <Card className="p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`w-4 h-4 ${toneClass}`} />
        </div>
        <div className="text-2xl font-semibold">{value}</div>
      </Card>
    </Link>
  );
}

function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function monthLabel(k: string) {
  const [y, m] = k.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}
