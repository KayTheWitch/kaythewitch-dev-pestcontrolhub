import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Wrench, MessageCircle, Mail } from "lucide-react";
import { formatDate, formatDateTime, OS_STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/r/$token")({
  component: ReportPublic,
  head: () => ({
    meta: [
      { title: "Relatório técnico de serviço | Pest Control Hub" },
      {
        name: "description",
        content:
          "Relatório técnico da ordem de serviço executada pela Pest Control Hub — Controle de Pragas, com produtos aplicados, lotes e responsável técnico.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Relatório técnico de serviço | Pest Control Hub" },
      {
        property: "og:description",
        content: "Consulte o relatório técnico da sua ordem de serviço.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ReportPublic() {
  const { token } = useParams({ from: "/r/$token" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["os-report", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_os_report_by_token", { _token: token });
      if (error) throw error;
      return data as any;
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando relatório...</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Relatório não encontrado</h1>
          <p className="text-sm text-muted-foreground">
            O link informado é inválido ou o relatório foi removido.
          </p>
        </div>
      </div>
    );
  }

  const os = data.os ?? {};
  const cliente = data.cliente ?? {};
  const produtos: any[] = data.produtos ?? [];
  const rt = data.rt;
  const checklist: any[] = Array.isArray(os.checklist) ? os.checklist : [];
  const url = typeof window !== "undefined" ? window.location.href : "";
  const msg = `Relatório técnico da OS #${os.numero} — Pest Control Hub — Controle de Pragas: ${url}`;

  return (
    <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto mb-4 flex flex-wrap gap-2 justify-end print:hidden px-4">
        <Button variant="outline" size="sm" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`mailto:?subject=${encodeURIComponent(
              `Relatório técnico — OS #${os.numero}`,
            )}&body=${encodeURIComponent(msg)}`}
          >
            <Mail className="w-4 h-4 mr-2" /> E-mail
          </a>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-6">
        <header className="flex items-start justify-between border-b pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Wrench className="w-6 h-6" />
              <div className="text-sm uppercase tracking-widest font-semibold">
                Relatório técnico de serviço
              </div>
            </div>
            <div className="text-2xl font-semibold mt-1">OS #{os.numero}</div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Pest Control Hub — Controle de Pragas</div>
            <div>{OS_STATUS_LABEL[os.status] ?? os.status}</div>
          </div>
        </header>

        <Section title="Cliente">
          <Field label="Nome" value={cliente.nome} />
          <Field label="Documento" value={cliente.documento} />
          <Field
            label="Endereço"
            value={[cliente.endereco, cliente.cidade, cliente.estado].filter(Boolean).join(" — ")}
          />
          <Field label="Contato" value={[cliente.telefone, cliente.email].filter(Boolean).join(" · ")} />
        </Section>

        <Section title="Execução">
          <Field label="Data prevista" value={formatDate(os.data_prevista)} />
          <Field label="Check-in" value={formatDateTime(os.checkin_at)} />
          <Field label="Check-out" value={formatDateTime(os.checkout_at)} />
          <Field label="Responsável" value={os.responsavel} />
        </Section>

        {checklist.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Checklist técnico
            </h2>
            <ul className="text-sm space-y-1">
              {checklist.map((c: any, i: number) => (
                <li key={i} className="flex gap-2">
                  <span>{c.ok || c.done ? "✔" : "—"}</span>
                  <span>{c.item ?? c.label ?? c.titulo ?? JSON.stringify(c)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Produtos aplicados
          </h2>
          {produtos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto registrado.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-1.5">Produto</th>
                  <th className="py-1.5">Registro MS</th>
                  <th className="py-1.5">Lote</th>
                  <th className="py-1.5">Validade</th>
                  <th className="py-1.5 text-right">Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5">
                      {p.nome}
                      {p.principio_ativo && (
                        <div className="text-xs text-muted-foreground">{p.principio_ativo}</div>
                      )}
                    </td>
                    <td className="py-1.5">{p.registro_ms ?? "—"}</td>
                    <td className="py-1.5">{p.lote ?? "—"}</td>
                    <td className="py-1.5">{formatDate(p.validade)}</td>
                    <td className="py-1.5 text-right">
                      {p.quantidade_aplicada ?? "—"} {p.unidade ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {os.observacoes_campo && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Observações de campo
            </h2>
            <p className="text-sm whitespace-pre-wrap">{os.observacoes_campo}</p>
          </div>
        )}

        <Section title="Responsável técnico">
          {rt ? (
            <>
              <Field label="Nome" value={rt.nome} />
              <Field label="Conselho" value={`${rt.conselho} ${rt.registro}`} />
              <Field label="ART" value={rt.art_numero} />
              <Field label="Validade da ART" value={formatDate(rt.art_validade)} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Não informado.</p>
          )}
        </Section>

        {data.certificado && (
          <p className="text-xs text-muted-foreground border-t pt-4">
            Certificado de Execução de Serviço disponível em{" "}
            <a className="underline" href={`/ces/${data.certificado}`}>
              /ces/{String(data.certificado).slice(0, 8)}…
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </h2>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
