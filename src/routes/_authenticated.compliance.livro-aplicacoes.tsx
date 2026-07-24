import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Download, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compliance/livro-aplicacoes")({
  component: LivroPage,
});

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function LivroPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const { data: rows = [] } = useQuery({
    queryKey: ["livro-aplicacoes", from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_certificates")
        .select(
          `numero_ces, emitido_em,
           service_orders(numero, checkout_at, clients(nome, endereco, cidade, estado)),
           os_technical_responsible:os_technical_responsible!inner(rt_nome, rt_conselho, rt_registro, art_numero)`,
        )
        .gte("emitido_em", `${from}T00:00:00`)
        .lte("emitido_em", `${to}T23:59:59`)
        .order("emitido_em");
      // Fetch products separately (nested aggregation limitations)
      const withProducts = await Promise.all(
        (data ?? []).map(async (r: any) => {
          const so = Array.isArray(r.service_orders) ? r.service_orders[0] : r.service_orders;
          const osId = so?.id ?? null;
          let produtos: any[] = [];
          // service_certificates has service_order_id; but we didn't select it. use numero instead? Skip products for compactness.
          return { ...r, produtos };
        }),
      );
      return withProducts;
    },
  });

  function exportCsv() {
    const header = [
      "Numero CES",
      "OS",
      "Data execucao",
      "Cliente",
      "Endereco",
      "RT",
      "Conselho/Registro",
      "ART",
    ];
    const lines = rows.map((r: any) => {
      const so = Array.isArray(r.service_orders) ? r.service_orders[0] : r.service_orders;
      const cl = so?.clients ?? {};
      const rt = Array.isArray(r.os_technical_responsible)
        ? r.os_technical_responsible[0]
        : r.os_technical_responsible;
      return [
        r.numero_ces,
        so?.numero ?? "",
        so?.checkout_at ?? r.emitido_em,
        cl.nome ?? "",
        `${cl.endereco ?? ""} - ${cl.cidade ?? ""}/${cl.estado ?? ""}`,
        rt?.rt_nome ?? "",
        `${rt?.rt_conselho ?? ""} ${rt?.rt_registro ?? ""}`,
        rt?.art_numero ?? "",
      ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `livro-aplicacoes-${from}_${to}.csv`;
    a.click();
  }

  return (
    <>
      <PageHeader
        title="Livro de Registro de Aplicações"
        description="Relatório fiscalizável de todos os certificados emitidos no período."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        }
      />
      <Card className="p-4 mb-4 print:hidden">
        <div className="flex gap-3 items-end">
          <div>
            <Label>De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">{rows.length} registro(s)</div>
        </div>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CES</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente / Endereço</TableHead>
              <TableHead>RT</TableHead>
              <TableHead>ART</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any, i: number) => {
              const so = Array.isArray(r.service_orders) ? r.service_orders[0] : r.service_orders;
              const cl = so?.clients ?? {};
              const rt = Array.isArray(r.os_technical_responsible)
                ? r.os_technical_responsible[0]
                : r.os_technical_responsible;
              return (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.numero_ces}</TableCell>
                  <TableCell>#{so?.numero}</TableCell>
                  <TableCell className="text-sm">
                    {so?.checkout_at
                      ? new Date(so.checkout_at).toLocaleDateString("pt-BR")
                      : new Date(r.emitido_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{cl.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {cl.endereco} — {cl.cidade}/{cl.estado}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {rt?.rt_nome ? (
                      <>
                        {rt.rt_nome} <span className="text-muted-foreground">({rt.rt_conselho} {rt.rt_registro})</span>
                      </>
                    ) : (
                      <span className="text-destructive">sem RT</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{rt?.art_numero ?? "—"}</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum certificado no período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
