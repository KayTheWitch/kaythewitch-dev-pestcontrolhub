import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  PAYMENT_METHOD_LABEL,
} from "@/lib/format";
import { FinancialStatusBadge } from "@/components/StatusBadge";
import { PaymentDialog } from "@/components/PaymentDialog";
import { ArrowLeft, Ban } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/financeiro/pagar/$id")({
  component: PagarDetail,
});

function PagarDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: ap } = useQuery({
    queryKey: ["ap", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounts_payable")
        .select(
          "*, suppliers(id,razao_social), financial_categories(nome), purchase_orders(id,numero)",
        )
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["ap-pay", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_payments")
        .select("*")
        .eq("payable_id", id)
        .order("data_pagamento", { ascending: false });
      return data ?? [];
    },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("accounts_payable")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Título cancelado");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!ap) return <div className="p-6 text-muted-foreground">Carregando...</div>;
  const saldo = Number(ap.valor_original) - Number(ap.valor_pago);

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/financeiro/pagar">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Pagamento ${ap.numero}`}
        description={ap.descricao}
        actions={
          <div className="flex gap-2">
            {saldo > 0 && ap.status !== "cancelado" && (
              <Button onClick={() => setOpen(true)}>Registrar pagamento</Button>
            )}
            {ap.status === "aberto" && Number(ap.valor_pago) === 0 && (
              <Button variant="outline" onClick={() => cancel.mutate()}>
                <Ban className="w-4 h-4 mr-2" /> Cancelar título
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Valor original</div>
          <div className="text-2xl font-semibold">{formatCurrency(ap.valor_original)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Pago</div>
          <div className="text-2xl font-semibold text-destructive">
            {formatCurrency(ap.valor_pago)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Saldo</div>
          <div className="text-2xl font-semibold">{formatCurrency(saldo)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5 space-y-2 text-sm">
          <Row k="Status" v={<FinancialStatusBadge status={ap.status} />} />
          <Row k="Fornecedor" v={ap.suppliers?.razao_social ?? "—"} />
          <Row k="Categoria" v={ap.financial_categories?.nome ?? "—"} />
          <Row k="Emissão" v={formatDate(ap.data_emissao)} />
          <Row k="Vencimento" v={formatDate(ap.data_vencimento)} />
          {ap.data_pagamento && <Row k="Pagamento" v={formatDate(ap.data_pagamento)} />}
          {ap.purchase_orders && (
            <Row k="Origem" v={`PC ${ap.purchase_orders.numero}`} />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Histórico de pagamentos</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{formatDateTime(p.created_at)}</TableCell>
                  <TableCell className="text-sm">
                    {PAYMENT_METHOD_LABEL[p.forma_pagamento] ?? p.forma_pagamento}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(p.valor)}
                  </TableCell>
                </TableRow>
              ))}
              {!payments.length && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-sm text-muted-foreground py-4"
                  >
                    Nenhum pagamento registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {ap.observacoes && (
        <Card className="p-5">
          <h3 className="font-semibold mb-2">Observações</h3>
          <p className="text-sm whitespace-pre-wrap">{ap.observacoes}</p>
        </Card>
      )}

      <PaymentDialog
        open={open}
        onOpenChange={setOpen}
        tipo="pagar"
        accountId={ap.id}
        saldo={saldo}
        numero={ap.numero}
      />
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
