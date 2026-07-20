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
import { OsStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/portal/os")({
  component: PortalOs,
});

function PortalOs() {
  const { clientId } = useAuth();
  const { data: rows = [] } = useQuery({
    enabled: !!clientId,
    queryKey: ["portal-os", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("id, numero, status, data_agendada, data_conclusao, report_token")
        .eq("client_id", clientId!)
        .order("data_agendada", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });

  return (
    <>
      <PortalPageHeader
        title="Ordens de serviço"
        description="Visitas agendadas e histórico de execuções."
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Agendamento</TableHead>
              <TableHead>Conclusão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-sm">{o.numero}</TableCell>
                <TableCell className="text-sm">
                  {o.data_agendada ? formatDate(o.data_agendada) : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {o.data_conclusao ? formatDate(o.data_conclusao) : "—"}
                </TableCell>
                <TableCell>
                  <OsStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right">
                  {o.report_token && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`/r/${o.report_token}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Relatório
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma OS registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
