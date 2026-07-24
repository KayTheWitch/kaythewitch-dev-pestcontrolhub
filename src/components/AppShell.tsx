import { Link, useRouter, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  FileText,
  Wrench,
  Package,
  ShieldCheck,
  UsersRound,
  Bug,
  LogOut,
  Settings,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Tags,
  BarChart3,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
const nav: { section: string; items: NavItem[] }[] = [
  {
    section: "Principal",
    items: [
      { to: "/", label: "Painel", icon: LayoutDashboard },
      { to: "/leads", label: "Leads", icon: UserPlus },
      { to: "/clientes", label: "Clientes", icon: Users },
      { to: "/propostas", label: "Propostas", icon: FileText },
      { to: "/os", label: "Ordens de Serviço", icon: ClipboardList },
      { to: "/bi", label: "BI", icon: BarChart3 },
      { to: "/compliance", label: "Compliance", icon: FileCheck2 },
    ],
  },
  {
    section: "Financeiro",
    items: [
      { to: "/financeiro", label: "Painel financeiro", icon: Wallet },
      { to: "/financeiro/receber", label: "Contas a receber", icon: ArrowDownCircle },
      { to: "/financeiro/pagar", label: "Contas a pagar", icon: ArrowUpCircle },
    ],
  },
  {
    section: "Cadastros",
    items: [
      { to: "/cadastros/servicos", label: "Serviços", icon: Settings },
      { to: "/cadastros/equipes", label: "Equipes", icon: UsersRound },
      { to: "/cadastros/produtos", label: "Produtos", icon: Package },
      { to: "/cadastros/epis", label: "EPIs", icon: ShieldCheck },
      { to: "/cadastros/categorias-financeiras", label: "Categorias financeiras", icon: Tags },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const { user } = useAuth();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-md bg-sidebar-primary flex items-center justify-center">
            <Bug className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">Ventura</div>
            <div className="text-xs text-sidebar-foreground/60">Gestão Operacional</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {nav.map((group) => (
            <div key={group.section}>
              <div className="px-3 mb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-2 pb-2 text-xs text-sidebar-foreground/70 truncate">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b bg-card">
          <Wrench className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Ventura</span>
        </div>
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
