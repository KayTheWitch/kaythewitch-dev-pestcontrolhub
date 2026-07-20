import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortalPageHeader } from "@/components/PortalShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { FileText, ClipboardList, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/portal/documentos")({
  component: PortalDocs,
});

function PortalDocs() {
  const { clientId } = useAuth();
  const { data } = useQuery({
    enabled: !!clientId,
    queryKey: ["portal-docs", clientId],
    queryFn: async () => {
      const [os, pr] = await Promise.all([
        supabase
          .from("service_orders")
          .select("id, numero, data_conclusao, report_token")
          .eq("client_id", clientId!)
          .not("report_token", "is", null)
          .order("data_conclusao", { ascending: false }),
        supabase
          .from("proposals")
          .select("id, numero, created_at, zapsign_signed_url")
          .eq("client_id", clientId!)
          .not("zapsign_signed_url", "is", null)
          .order("created_at", { ascending: false }),
      ]);
      return { os: os.data ?? [], proposals: pr.data ?? [] };
    },
  });

  return (
    <>
      <PortalPageHeader
        title="Documentos"
        description="Relatórios técnicos e propostas assinadas."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-4 border-b flex items-center gap-2 font-semibold">
            <ClipboardList className="w-4 h-4" /> Relatórios técnicos
          </div>
          <ul className="divide-y">
            {(data?.os ?? []).map((o: any) => (
              <li key={o.id} className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono">{o.numero}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.data_conclusao ? formatDate(o.data_conclusao) : "—"}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a href={`/r/${o.report_token}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Abrir
                  </a>
                </Button>
              </li>
            ))}
            {!(data?.os ?? []).length && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Nenhum relatório disponível.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <div className="p-4 border-b flex items-center gap-2 font-semibold">
            <FileText className="w-4 h-4" /> Propostas assinadas
          </div>
          <ul className="divide-y">
            {(data?.proposals ?? []).map((p: any) => (
              <li key={p.id} className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono">{p.numero}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(p.created_at)}</div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a href={p.zapsign_signed_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Abrir
                  </a>
                </Button>
              </li>
            ))}
            {!(data?.proposals ?? []).length && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma proposta assinada.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
