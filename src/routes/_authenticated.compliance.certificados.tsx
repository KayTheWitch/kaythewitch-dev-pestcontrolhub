import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compliance/certificados")({
  component: CertificadosPage,
});

function CertificadosPage() {
  const { data: rows = [] } = useQuery({
    queryKey: ["service_certificates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_certificates")
        .select(
          "id, numero_ces, emitido_em, token_publico, service_order_id, service_orders(numero, client_id, clients(nome))",
        )
        .order("emitido_em", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  function copyLink(token: string) {
    const url = `${window.location.origin}/ces/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  return (
    <>
      <PageHeader
        title="Certificados de Execução (CES)"
        description="Documentos emitidos automaticamente ao concluir cada OS. Compartilhe o link público para verificação."
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Emitido em</TableHead>
              <TableHead className="w-40"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.numero_ces}</TableCell>
                <TableCell>
                  <Link
                    to="/os/$id"
                    params={{ id: r.service_order_id }}
                    className="text-primary hover:underline"
                  >
                    #{r.service_orders?.numero}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">
                  {r.service_orders?.clients?.nome ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(r.emitido_em).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyLink(r.token_publico)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <a
                      href={`/ces/${r.token_publico}`}
                      target="_blank"
                      rel="noopener"
                    >
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                      </Button>
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum CES emitido ainda. Conclua uma OS para gerar o primeiro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
