import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bug } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  component: AcceptInvite,
});

function AcceptInvite() {
  const { token } = Route.useParams();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (loading || !session || accepted) return;
    (async () => {
      const { error } = await supabase.rpc("accept_client_invitation", { _token: token });
      if (error) {
        toast.error(error.message);
        return;
      }
      setAccepted(true);
      toast.success("Convite aceito! Bem-vindo ao portal.");
      setTimeout(() => navigate({ to: "/portal" }), 400);
    })();
  }, [session, loading, token, accepted, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const fn =
      mode === "signup"
        ? supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/invite/${token}` },
          })
        : supabase.auth.signInWithPassword({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) toast.error(error.message);
    else if (mode === "signup")
      toast.success("Cadastro criado. Verifique seu e-mail se necessário.");
  }

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Carregando...</div>;

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <p className="text-sm">Validando convite...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <Bug className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold">Pest Control Hub</div>
            <div className="text-xs text-muted-foreground">Aceitar convite</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {mode === "signup"
            ? "Crie uma senha para acessar o portal."
            : "Entre para vincular sua conta."}
        </p>
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
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Enviando..." : mode === "signup" ? "Criar conta" : "Entrar"}
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground w-full text-center underline"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? "Já tenho conta" : "Criar nova conta"}
          </button>
        </form>
      </Card>
    </div>
  );
}
