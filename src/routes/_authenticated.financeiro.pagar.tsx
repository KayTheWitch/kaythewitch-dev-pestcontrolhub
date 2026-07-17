import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, FINANCIAL_STATUS_LABEL } from "@/lib/format";
import { FinancialStatusBadge } from "@/components/StatusBadge";
import { PaymentDialog } from "@/components/PaymentDialog";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/financeiro/pagar")({
  component: PagarPage,
});

function PagarPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [pay, setPay] = useState<{ id: string; saldo: number; numero: string } | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["ap-list", status],
    queryFn: async () => {
      await supabase.rpc("refresh_overdue_accounts");
      let query = supabase
        .from("accounts_payable")
        .select(
          "id, numero, descricao, valor_original, valor_pago, data_emissao, data_vencimento, status, purchase_order_id, suppliers(razao_social)",
        )
        .order("data_vencimento", { ascending: true });
      if (status !== "all") query = query.eq("status", status as any);
      const { data } = await query;
      return data ?? [];
    },
  });

  const filtered = rows.filter((r: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.numero?.toLowerCase().includes(s) ||
      r.descricao?.toLowerCase().includes(s) ||
      r.suppliers?.razao_social?.toLowerCase().includes(s)
    );
  });

  return (
    <>
      <PageHeader
        title="Contas a pagar"
        description="Títulos gerados por pedidos de compra recebidos e lançamentos manuais."
        actions={
          <Button asChild>
            <Link to="/financeiro/lancamento/novo" search={{ tipo: "pagar" }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo lançamento
            </Link>
          </Button>
        }
      />

      <Card className="p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-56">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, fornecedor, descrição..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(FINANCIAL_STATUS_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fornecedor / descrição</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r: any) => {
              const saldo = Number(r.valor_original) - Number(r.valor_pago);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">
                    <Link to="/financeiro/pagar/$id" params={{ id: r.id }} className="hover:underline">
                      {r.numero}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.suppliers?.razao_social ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.descricao}</div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(r.data_emissao)}</TableCell>
                  <TableCell className="text-sm">{formatDate(r.data_vencimento)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.valor_original)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(saldo)}</TableCell>
                  <TableCell>
                    <FinancialStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    {saldo > 0 && r.status !== "cancelado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPay({ id: r.id, saldo, numero: r.numero })}
                      >
                        Baixar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum título encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {pay && (
        <PaymentDialog
          open
          onOpenChange={(v) => !v && setPay(null)}
          tipo="pagar"
          accountId={pay.id}
          saldo={pay.saldo}
          numero={pay.numero}
        />
      )}
    </>
  );
}
