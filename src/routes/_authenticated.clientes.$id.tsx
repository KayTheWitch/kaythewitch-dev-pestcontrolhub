import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ArrowLeft, FileText, ClipboardList } from "lucide-react";
import {
  CATEGORY_LABEL,
  formatCurrency,
  formatDate,
  SERVICE_TYPE_LABEL,
} from "@/lib/format";
import { ProposalStatusBadge, OsStatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/clientes/$id")({
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const [client, diagnostics, proposals, os] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("diagnostics")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("proposals")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("service_orders")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
      ]);
      return {
        client: client.data,
        diagnostics: diagnostics.data ?? [],
        proposals: proposals.data ?? [],
        os: os.data ?? [],
      };
    },
  });

  if (!data?.client) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }
  const c = data.client;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
        <Link to="/clientes">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
      </Button>
      <PageHeader
        title={c.nome}
        description={`${c.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"} · ${CATEGORY_LABEL[c.categoria]}`}
        actions={
          <Button asChild>
            <Link to="/diagnosticos/novo" search={{ clientId: c.id }}>
              <FileText className="w-4 h-4 mr-2" />
              Novo diagnóstico
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Documento</div>
          <div className="text-sm">{c.documento || "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Contato</div>
          <div className="text-sm">{c.telefone || "—"}</div>
          <div className="text-xs text-muted-foreground">{c.email}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Endereço</div>
          <div className="text-sm">
            {c.endereco || "—"}
            {c.cidade && (
              <div className="text-xs text-muted-foreground">
                {c.cidade}
                {c.estado && `/${c.estado}`} {c.cep && `· ${c.cep}`}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Diagnósticos</h3>
          <Badge variant="outline">{data.diagnostics.length}</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Necessidade</TableHead>
              <TableHead>Urgência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.diagnostics.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell>{formatDate(d.created_at)}</TableCell>
                <TableCell>{SERVICE_TYPE_LABEL[d.tipo_servico]}</TableCell>
                <TableCell>{d.praga_necessidade || "—"}</TableCell>
                <TableCell className="capitalize">{d.urgencia}</TableCell>
              </TableRow>
            ))}
            {data.diagnostics.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                  Nenhum diagnóstico ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="mb-6">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Propostas</h3>
          <Badge variant="outline">{data.proposals.length}</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.proposals.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>#{p.numero}</TableCell>
                <TableCell>{formatDate(p.created_at)}</TableCell>
                <TableCell>{formatCurrency(p.total)}</TableCell>
                <TableCell>
                  <ProposalStatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/propostas/$id" params={{ id: p.id }}>
                      Abrir
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.proposals.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                  Nenhuma proposta.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Ordens de serviço
          </h3>
          <Badge variant="outline">{data.os.length}</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Data prevista</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.os.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell>#{o.numero}</TableCell>
                <TableCell>{formatDate(o.data_prevista)}</TableCell>
                <TableCell>{o.responsavel || "—"}</TableCell>
                <TableCell>
                  <OsStatusBadge status={o.status} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/os/$id" params={{ id: o.id }}>
                      Abrir
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.os.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
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
