import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "comercial" | "tecnico" | "cliente";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setRoles([]);
      setClientId(null);
      return;
    }
    (async () => {
      const [r, p] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        supabase.from("profiles").select("client_id").eq("id", session.user.id).maybeSingle(),
      ]);
      setRoles(((r.data ?? []) as any[]).map((x) => x.role as Role));
      setClientId((p.data as any)?.client_id ?? null);
    })();
  }, [session?.user?.id]);

  const isClient = roles.includes("cliente");
  const isStaff = roles.includes("admin") || roles.includes("comercial") || roles.includes("tecnico");

  return {
    session,
    user: session?.user ?? null,
    loading,
    roles,
    clientId,
    isClient,
    isStaff,
  };
}
