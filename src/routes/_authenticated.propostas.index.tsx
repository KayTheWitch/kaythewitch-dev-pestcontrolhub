import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ProposalStatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/propostas/")({
  component: PropostasList,
});

function PropostasList() {
  const [status, setStatus] = useState("all");

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals", status],
    queryFn: async () => {
      let q = supabase
        .from("proposals")
        .select("*, clients(nome)")
        .order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status as any);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <PageHeader
        title="Propostas"
        description="Acompanhe cada proposta do rascunho à aprovação e assinatura."
      />

      <div className="mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="em_assinatura">Em assinatura</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="recusada">Recusada</SelectItem>
            <SelectItem value="expirada">Expirada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">#{p.numero}</TableCell>
                <TableCell>{p.clients?.nome ?? "—"}</TableCell>
                <TableCell>{formatCurrency(p.total)}</TableCell>
                <TableCell>
                  <ProposalStatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(p.created_at)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/propostas/$id" params={{ id: p.id }}>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {proposals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhuma proposta.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
