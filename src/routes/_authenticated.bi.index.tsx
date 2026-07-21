import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { BarChart3, ClipboardList, Package, Wallet, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bi/")({
  head: () => ({
    meta: [
      { title: "BI — Ventura" },
      { name: "description", content: "Painéis analíticos da operação." },
    ],
  }),
  component: BIIndex,
});

const cards = [
  { to: "/bi/comercial", icon: BarChart3, title: "Comercial", desc: "Funil de leads, propostas, taxa de conversão." },
  { to: "/bi/operacional", icon: ClipboardList, title: "Operacional", desc: "OS por status, tempo médio e produtividade por equipe." },
  { to: "/bi/estoque", icon: Package, title: "Estoque & Compras", desc: "Itens críticos, vencimentos e desempenho de fornecedores." },
  { to: "/bi/financeiro", icon: Wallet, title: "Financeiro", desc: "DRE mensal, aging de recebíveis e a pagar." },
];

function BIIndex() {
  return (
    <div>
      <PageHeader
        title="Business Intelligence"
        description="Consolidação de indicadores comerciais, operacionais e financeiros."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to}>
              <Card className="p-5 hover:border-primary transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      {c.title}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{c.desc}</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
