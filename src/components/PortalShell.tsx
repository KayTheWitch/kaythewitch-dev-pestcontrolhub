import { Link, useLocation, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Wallet,
  FolderOpen,
  LogOut,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/portal", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/portal/propostas", label: "Propostas", icon: FileText },
  { to: "/portal/os", label: "Ordens de serviço", icon: ClipboardList },
  { to: "/portal/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/portal/documentos", label: "Documentos", icon: FolderOpen },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const { user } = useAuth();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    router.navigate({ to: "/portal" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Bug className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-sm">Ventura</div>
              <div className="text-[11px] text-muted-foreground">Portal do Cliente</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs text-muted-foreground truncate max-w-[220px]">
              {user?.email}
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {items.map((it) => {
            const active = it.exact
              ? location.pathname === it.to
              : location.pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm border-b-2 whitespace-nowrap transition-colors",
                  active
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

export function PortalPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
