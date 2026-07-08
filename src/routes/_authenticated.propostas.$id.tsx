import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Printer,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ProposalStatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/propostas/$id")({
  component: PropostaDetail,
});

function PropostaDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const router = useRouter();
  const [lgpd, setLgpd] = useState(false);

  const { data: p } = useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, clients(*), diagnostics(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const patch: any = { status };
      if (status === "enviada") patch.sent_at = new Date().toISOString();
      if (status === "aprovada") patch.signed_at = new Date().toISOString();
      const { error } = await supabase.from("proposals").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposal", id] });
      qc.invalidateQueries({ queryKey: ["proposals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendForSignature = useMutation({
    mutationFn: async () => {
      if (!lgpd) throw new Error("É necessário registrar o aceite LGPD");
      const { error } = await supabase
        .from("proposals")
        .update({
          status: "em_assinatura",
          sent_at: new Date().toISOString(),
          lgpd_aceite: true,
          signature_provider: "zapsign_pending",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposta enviada para assinatura");
      qc.invalidateQueries({ queryKey: ["proposal", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateOs = useMutation({
    mutationFn: async () => {
      if (!p) throw new Error("Proposta não encontrada");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("service_orders")
        .insert({
          proposal_id: p.id,
          client_id: p.client_id,
          diagnostic_id: p.diagnostic_id,
          checklist: [
            { label: "Isolamento e sinalização da área", ok: false },
            { label: "Uso de EPIs conforme FISPQ", ok: false },
            { label: "Aplicação conforme rótulo do produto", ok: false },
            { label: "Registro fotográfico antes e depois", ok: false },
            { label: "Assinatura do cliente", ok: false },
          ],
          produtos_previstos: (p.itens as any) ?? [],
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (os) => {
      toast.success("OS gerada");
      router.navigate({ to: "/os/$id", params: { id: os.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!p) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  const validade = p.sent_at
    ? new Date(new Date(p.sent_at).getTime() + p.validade_dias * 86400_000)
    : null;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
        <Link to="/propostas">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
      </Button>
      <PageHeader
        title={`Proposta #${p.numero}`}
        description={p.clients?.nome}
        actions={
          <div className="flex items-center gap-2">
            <ProposalStatusBadge status={p.status} />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Itens</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="w-24 text-right">Qtd</TableHead>
                  <TableHead className="w-32 text-right">Unitário</TableHead>
                  <TableHead className="w-32 text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((p.itens as any[]) ?? []).map((i: any, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{i.nome}</TableCell>
                    <TableCell className="text-right">{i.quantidade}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(i.preco_base)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(i.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="space-y-1 text-sm max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(p.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem</span>
                <span>{Number(p.margem_pct).toFixed(1)}%</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(p.total)}</span>
              </div>
            </div>
          </Card>

          {p.diagnostics && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Diagnóstico</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Necessidade</dt>
                  <dd>{(p.diagnostics as any).praga_necessidade || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Urgência</dt>
                  <dd className="capitalize">{(p.diagnostics as any).urgencia}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Área/Volume</dt>
                  <dd>
                    {(p.diagnostics as any).area_m2
                      ? `${(p.diagnostics as any).area_m2} m²`
                      : `${(p.diagnostics as any).volume_l ?? "—"} L`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Periodicidade</dt>
                  <dd>{(p.diagnostics as any).periodicidade}</dd>
                </div>
              </dl>
              {(p.diagnostics as any).observacoes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {(p.diagnostics as any).observacoes}
                  </p>
                </>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Cliente</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium">{p.clients?.nome}</div>
              <div className="text-muted-foreground">{p.clients?.documento}</div>
              <div className="text-muted-foreground">{p.clients?.email}</div>
              <div className="text-muted-foreground">{p.clients?.telefone}</div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Assinatura eletrônica</h3>
            <div className="text-xs text-muted-foreground space-y-1 mb-3">
              <div>Criada em: {formatDate(p.created_at)}</div>
              <div>Enviada em: {p.sent_at ? formatDate(p.sent_at) : "—"}</div>
              <div>Assinada em: {p.signed_at ? formatDate(p.signed_at) : "—"}</div>
              {validade && <div>Válida até: {formatDate(validade)}</div>}
            </div>

            {p.status === "rascunho" && (
              <div className="space-y-3">
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox
                    checked={lgpd}
                    onCheckedChange={(v) => setLgpd(!!v)}
                    id="lgpd"
                  />
                  <span>
                    O cliente está ciente da coleta e uso de dados conforme LGPD.
                  </span>
                </label>
                <Button
                  className="w-full"
                  disabled={!lgpd || sendForSignature.isPending}
                  onClick={() => sendForSignature.mutate()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para assinatura
                </Button>
              </div>
            )}

            {p.status === "em_assinatura" && (
              <div className="space-y-2">
                <div className="text-xs bg-warning/10 text-warning-foreground border border-warning/30 rounded-md p-2">
                  Aguardando assinatura do cliente. Em produção, este status é
                  atualizado via webhook do provedor.
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => updateStatus.mutate("aprovada")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Registrar assinatura
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => updateStatus.mutate("recusada")}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Marcar recusada
                </Button>
              </div>
            )}

            {p.status === "aprovada" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Gerar OS
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Gerar Ordem de Serviço?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Uma OS será criada com base nos itens da proposta e ficará
                      disponível para agendamento e execução.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => generateOs.mutate()}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
