import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortalPageHeader } from "@/components/PortalShell";
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
import { ProposalStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/portal/propostas")({
  component: PortalProposals,
});

function PortalProposals() {
  const { clientId } = useAuth();
  const { data: rows = [] } = useQuery({
    enabled: !!clientId,
    queryKey: ["portal-proposals", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("proposals")
        .select("id, numero, status, valor_total, created_at, validade, zapsign_signed_url, zapsign_sign_url")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <>
      <PortalPageHeader title="Propostas" description="Histórico e propostas em aberto." />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p: any) => {
              const url = p.zapsign_signed_url || p.zapsign_sign_url;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.numero}</TableCell>
                  <TableCell className="text-sm">{formatDate(p.created_at)}</TableCell>
                  <TableCell className="text-sm">{p.validade ? formatDate(p.validade) : "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.valor_total ?? 0)}</TableCell>
                  <TableCell>
                    <ProposalStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={url} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          {p.zapsign_signed_url ? "Ver assinada" : "Assinar"}
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
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
