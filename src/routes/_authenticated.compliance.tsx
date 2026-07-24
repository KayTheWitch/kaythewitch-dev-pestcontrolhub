import { createFileRoute, Outlet, Link, useLocation, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/compliance")({
  component: ComplianceLayout,
});

const tabs = [
  { to: "/compliance", label: "Visão geral", exact: true },
  { to: "/compliance/rt", label: "Responsáveis técnicos" },
  { to: "/compliance/produtos-regulatorio", label: "Produtos (regulatório)" },
  { to: "/compliance/certificados", label: "Certificados (CES)" },
  { to: "/compliance/livro-aplicacoes", label: "Livro de aplicações" },
  { to: "/compliance/epis", label: "Entrega de EPIs" },
  { to: "/compliance/embalagens", label: "Devolução de embalagens" },
];

function ComplianceLayout() {
  const { roles } = useAuth();
  const { pathname } = useLocation();
  const allowed =
    roles.includes("admin") || roles.includes("comercial") || roles.includes("tecnico");
  if (roles.length && !allowed) return <Navigate to="/" />;

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
