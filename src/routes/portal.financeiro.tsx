import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortalPageHeader } from "@/components/PortalShell";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinancialStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/portal/financeiro")({
  component: PortalFinance,
});

function PortalFinance() {
  const { clientId } = useAuth();
  const { data } = useQuery({
    enabled: !!clientId,
    queryKey: ["portal-finance", clientId],
    queryFn: async () => {
      const [ar, pay] = await Promise.all([
        supabase
          .from("accounts_receivable")
          .select("id, numero, descricao, valor_original, valor_pago, data_emissao, data_vencimento, data_pagamento, status")
          .eq("client_id", clientId!)
          .order("data_vencimento", { ascending: true }),
        supabase
          .from("financial_payments")
          .select("valor, data_pagamento, forma_pagamento, receivable_id")
          .eq("tipo", "receber")
          .order("data_pagamento", { ascending: false }),
      ]);
      return { rows: ar.data ?? [], payments: pay.data ?? [] };
    },
  });

  const rows = data?.rows ?? [];
  const open = rows
    .filter((r: any) => r.status !== "pago" && r.status !== "cancelado")
    .reduce((s: number, r: any) => s + (Number(r.valor_original) - Number(r.valor_pago)), 0);
  const overdue = rows
    .filter((r: any) => r.status === "vencido")
    .reduce((s: number, r: any) => s + (Number(r.valor_original) - Number(r.valor_pago)), 0);

  return (
    <>
      <PortalPageHeader title="Financeiro" description="Faturas emitidas e pagamentos recebidos." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Saldo em aberto</div>
          <div className="text-2xl font-semibold">{formatCurrency(open)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Vencidos</div>
          <div className="text-2xl font-semibold text-destructive">{formatCurrency(overdue)}</div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b font-semibold">Faturas</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => {
              const saldo = Number(r.valor_original) - Number(r.valor_pago);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.numero}</TableCell>
                  <TableCell className="text-sm">{r.descricao}</TableCell>
                  <TableCell className="text-sm">{formatDate(r.data_emissao)}</TableCell>
                  <TableCell className="text-sm">{formatDate(r.data_vencimento)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.valor_original)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(saldo)}</TableCell>
                  <TableCell>
                    <FinancialStatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma fatura.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <div className="p-4 border-b font-semibold">Pagamentos recebidos</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.payments ?? []).map((p: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="text-sm">{formatDate(p.data_pagamento)}</TableCell>
                <TableCell className="text-sm capitalize">{p.forma_pagamento}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.valor)}</TableCell>
              </TableRow>
            ))}
            {!(data?.payments ?? []).length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum pagamento registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
