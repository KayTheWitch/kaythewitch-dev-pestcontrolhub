import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortalPageHeader } from "@/components/PortalShell";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";
import { FileText, ClipboardList, Wallet } from "lucide-react";

export const Route = createFileRoute("/portal/")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const { clientId } = useAuth();
  const { data } = useQuery({
    enabled: !!clientId,
    queryKey: ["portal-dashboard", clientId],
    queryFn: async () => {
      const [client, prop, os, ar] = await Promise.all([
        supabase.from("clients").select("nome, email").eq("id", clientId!).maybeSingle(),
        supabase
          .from("proposals")
          .select("id, numero, status")
          .eq("client_id", clientId!),
        supabase
          .from("service_orders")
          .select("id, numero, status, data_agendada")
          .eq("client_id", clientId!)
          .order("data_agendada", { ascending: false })
          .limit(5),
        supabase
          .from("accounts_receivable")
          .select("valor_original, valor_pago, status")
          .eq("client_id", clientId!),
      ]);
      const openProposals = (prop.data ?? []).filter(
        (p: any) => p.status === "enviada" || p.status === "aguardando_assinatura",
      ).length;
      const openBalance = (ar.data ?? [])
        .filter((r: any) => r.status !== "pago" && r.status !== "cancelado")
        .reduce((s: number, r: any) => s + (Number(r.valor_original) - Number(r.valor_pago)), 0);
      return {
        client: client.data,
        openProposals,
        totalOs: (os.data ?? []).length,
        recentOs: os.data ?? [],
        openBalance,
      };
    },
  });

  return (
    <>
      <PortalPageHeader
        title={`Olá${data?.client?.nome ? `, ${data.client.nome}` : ""}`}
        description="Acompanhe suas propostas, visitas e faturas."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/portal/propostas">
          <Card className="p-4 hover:border-primary transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <FileText className="w-4 h-4" /> Propostas em aberto
            </div>
            <div className="text-2xl font-semibold">{data?.openProposals ?? 0}</div>
          </Card>
        </Link>
        <Link to="/portal/os">
          <Card className="p-4 hover:border-primary transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <ClipboardList className="w-4 h-4" /> Ordens de serviço
            </div>
            <div className="text-2xl font-semibold">{data?.totalOs ?? 0}</div>
          </Card>
        </Link>
        <Link to="/portal/financeiro">
          <Card className="p-4 hover:border-primary transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Wallet className="w-4 h-4" /> Saldo em aberto
            </div>
            <div className="text-2xl font-semibold">
              {formatCurrency(data?.openBalance ?? 0)}
            </div>
          </Card>
        </Link>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Últimas ordens de serviço</h3>
        {data?.recentOs?.length ? (
          <ul className="divide-y">
            {data.recentOs.map((o: any) => (
              <li key={o.id} className="py-2 flex justify-between text-sm">
                <span className="font-mono">{o.numero}</span>
                <span className="text-muted-foreground">
                  {o.data_agendada ? formatDate(o.data_agendada) : "—"}
                </span>
                <span className="capitalize">{o.status?.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma OS registrada ainda.</p>
        )}
      </Card>
    </>
  );
}
