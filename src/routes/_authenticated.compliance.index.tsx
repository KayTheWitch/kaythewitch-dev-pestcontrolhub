import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import {
  ShieldCheck,
  FileCheck2,
  Package,
  BookOpen,
  HardHat,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/compliance/")({
  component: ComplianceOverview,
});

function ComplianceOverview() {
  const { data: kpis } = useQuery({
    queryKey: ["compliance", "kpis"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
      const [ces, rts, rtsExp, prodsSem, produtos] = await Promise.all([
        supabase.from("service_certificates").select("id", { count: "exact", head: true }),
        supabase
          .from("technical_responsibles")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true),
        supabase
          .from("technical_responsibles")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true)
          .lte("art_validade", in60)
          .gte("art_validade", today),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true)
          .or("registro_ms.is.null,registro_ms.eq."),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("ativo", true),
      ]);
      return {
        ces: ces.count ?? 0,
        rts: rts.count ?? 0,
        rtsExp: rtsExp.count ?? 0,
        prodsSem: prodsSem.count ?? 0,
        produtos: produtos.count ?? 0,
      };
    },
  });

  const cards = [
    {
      to: "/compliance/certificados",
      icon: FileCheck2,
      label: "Certificados (CES) emitidos",
      value: kpis?.ces ?? "—",
    },
    {
      to: "/compliance/rt",
      icon: ShieldCheck,
      label: "RTs ativos",
      value: kpis?.rts ?? "—",
      subtitle:
        kpis && kpis.rtsExp > 0 ? `${kpis.rtsExp} com ART vencendo em 60 dias` : "",
    },
    {
      to: "/compliance/produtos-regulatorio",
      icon: Package,
      label: "Produtos ativos",
      value: kpis ? `${kpis.produtos - kpis.prodsSem}/${kpis.produtos}` : "—",
      subtitle: kpis && kpis.prodsSem > 0 ? `${kpis.prodsSem} sem registro MS` : "",
    },
    {
      to: "/compliance/livro-aplicacoes",
      icon: BookOpen,
      label: "Livro de aplicações",
      value: "Relatório",
    },
    {
      to: "/compliance/epis",
      icon: HardHat,
      label: "Entregas de EPI",
      value: "Registrar",
    },
    {
      to: "/compliance/embalagens",
      icon: Trash2,
      label: "Devolução de embalagens",
      value: "Registrar",
    },
  ];

  return (
    <>
      <PageHeader
        title="Compliance ANVISA"
        description="Documentação sanitária, responsáveis técnicos, certificados e rastreabilidade."
      />
      {kpis && (kpis.prodsSem > 0 || kpis.rtsExp > 0) && (
        <Card className="p-4 mb-4 border-amber-300 bg-amber-50">
          <div className="flex gap-2 items-start text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Pendências regulatórias</div>
              <ul className="mt-1 list-disc list-inside">
                {kpis.prodsSem > 0 && (
                  <li>
                    {kpis.prodsSem} produto(s) ativo(s) sem registro MS cadastrado.
                  </li>
                )}
                {kpis.rtsExp > 0 && (
                  <li>{kpis.rtsExp} responsável(is) técnico(s) com ART vencendo em 60 dias.</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to}>
              <Card className="p-5 hover:border-primary transition-colors h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </div>
                    <div className="text-2xl font-semibold mt-1">{c.value}</div>
                    {c.subtitle && (
                      <div className="text-xs text-amber-700 mt-1">{c.subtitle}</div>
                    )}
                  </div>
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
