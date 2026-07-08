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
import { formatDate } from "@/lib/format";
import { OsStatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/os/")({
  component: OsList,
});

function OsList() {
  const [status, setStatus] = useState("all");

  const { data: rows = [] } = useQuery({
    queryKey: ["os-list", status],
    queryFn: async () => {
      let q = supabase
        .from("service_orders")
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
        title="Ordens de serviço"
        description="Ordens geradas a partir de propostas aprovadas."
      />
      <div className="mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="aguardando_execucao">Aguardando execução</SelectItem>
            <SelectItem value="em_execucao">Em execução</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data prevista</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">#{o.numero}</TableCell>
                <TableCell>{o.clients?.nome}</TableCell>
                <TableCell>{formatDate(o.data_prevista)}</TableCell>
                <TableCell>
                  <OsStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(o.created_at)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/os/$id" params={{ id: o.id }}>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhuma OS.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
