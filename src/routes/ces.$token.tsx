import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/ces/$token")({
  component: CesPublic,
  head: () => ({
    meta: [
      { title: "Certificado de Execução de Serviço | Pest Control Hub" },
      {
        name: "description",
        content:
          "Verificação pública de Certificado de Execução de Serviço emitido pela Pest Control Hub — Controle de Pragas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function CesPublic() {
  const { token } = useParams({ from: "/ces/$token" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["ces", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_certificate_by_token", { _token: token });
      if (error) throw error;
      return data as any;
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando certificado...</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Certificado não encontrado</h1>
          <p className="text-sm text-muted-foreground">
            O link informado é inválido ou o certificado foi removido.
          </p>
        </div>
      </div>
    );
  }

  const c = data;
  return (
    <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-6">
        <header className="flex items-start justify-between border-b pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-6 h-6" />
              <div className="text-sm uppercase tracking-widest font-semibold">
                Certificado de Execução de Serviço
              </div>
            </div>
            <h1 className="text-2xl font-bold mt-2">Pest Control Hub — Controle de Pragas</h1>
            <div className="text-xs text-muted-foreground">
              Documento emitido conforme RDC 52/2009 — ANVISA
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Nº do certificado</div>
            <div className="font-mono text-lg font-bold">{c.numero_ces}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Emitido em {new Date(c.emitido_em).toLocaleString("pt-BR")}
            </div>
          </div>
        </header>

        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Cliente
          </h2>
          <div className="text-sm">
            <div className="font-medium">{c.cliente?.nome}</div>
            {c.cliente?.documento && (
              <div className="text-muted-foreground">CPF/CNPJ: {c.cliente.documento}</div>
            )}
            <div className="text-muted-foreground">
              {c.cliente?.endereco} — {c.cliente?.cidade}/{c.cliente?.estado}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Execução
          </h2>
          <div className="text-sm">
            <div>
              <span className="text-muted-foreground">OS nº</span>{" "}
              <span className="font-mono">#{c.os?.numero}</span>
            </div>
            {c.os?.data_execucao && (
              <div>
                <span className="text-muted-foreground">Data de execução:</span>{" "}
                {new Date(c.os.data_execucao).toLocaleString("pt-BR")}
              </div>
            )}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Produtos aplicados
          </h2>
          {c.produtos && c.produtos.length > 0 ? (
            <table className="w-full text-sm border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 border-b">Produto</th>
                  <th className="text-left p-2 border-b">Princípio ativo</th>
                  <th className="text-left p-2 border-b">Reg. MS</th>
                  <th className="text-left p-2 border-b">Classe</th>
                  <th className="text-left p-2 border-b">Lote</th>
                  <th className="text-right p-2 border-b">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {c.produtos.map((p: any, i: number) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-2">{p.nome}</td>
                    <td className="p-2 text-xs">{p.principio_ativo || "—"}</td>
                    <td className="p-2 text-xs">{p.registro_ms || "—"}</td>
                    <td className="p-2 text-xs">{p.classe_toxicologica || "—"}</td>
                    <td className="p-2 text-xs">{p.lote || "—"}</td>
                    <td className="p-2 text-right">
                      {p.quantidade_aplicada} {p.unidade || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhum produto registrado.</div>
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Responsável Técnico
          </h2>
          {c.rt ? (
            <div className="text-sm">
              <div className="font-medium">{c.rt.nome}</div>
              <div className="text-muted-foreground">
                {c.rt.conselho} {c.rt.registro}
                {c.rt.art_numero ? ` — ART ${c.rt.art_numero}` : ""}
              </div>
              {c.rt.art_validade && (
                <div className="text-xs text-muted-foreground">
                  ART válida até {new Date(c.rt.art_validade).toLocaleDateString("pt-BR")}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              RT não informado neste certificado.
            </div>
          )}
        </section>

        <section className="mb-6 text-xs text-muted-foreground border-t pt-4">
          <p className="mb-1">
            <strong>Em caso de intoxicação:</strong> ligue para o Centro de Informações
            Toxicológicas (CIT) — Disque Intoxicação 0800 722 6001.
          </p>
          <p>
            <strong>Garantia e orientações pós-serviço:</strong> conforme contrato firmado.
            Mantenha ambiente ventilado e afastado de crianças e animais por 4 horas após a
            aplicação.
          </p>
        </section>

        <footer className="text-xs text-muted-foreground border-t pt-3 flex items-center justify-between">
          <div>Verificação pública em {typeof window !== "undefined" ? window.location.href : ""}</div>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="w-3 h-3 mr-1" />
            Imprimir / Salvar PDF
          </Button>
        </footer>
      </div>
    </div>
  );
}
