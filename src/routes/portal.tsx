import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalShell } from "@/components/PortalShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bug, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  const { loading, session, isClient, clientId } = useAuth();

  if (loading) {
    return <div className="p-10 text-sm text-muted-foreground">Carregando...</div>;
  }

  if (!session) return <PortalLogin />;

  if (!isClient || !clientId) return <NoAccess />;

  return (
    <PortalShell>
      <Outlet />
    </PortalShell>
  );
}

function PortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <Bug className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold">Pest Control Hub</div>
            <div className="text-xs text-muted-foreground">Portal do Cliente</div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Acesso somente para clientes convidados.
          </p>
        </form>
      </Card>
    </div>
  );
}

function NoAccess() {
  async function signOut() {
    await supabase.auth.signOut();
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md p-6 text-center space-y-4">
        <h2 className="text-lg font-semibold">Acesso não liberado</h2>
        <p className="text-sm text-muted-foreground">
          Sua conta ainda não está vinculada a um cliente. Verifique o e-mail de convite
          recebido ou solicite acesso ao suporte.
        </p>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </Card>
    </div>
  );
}
