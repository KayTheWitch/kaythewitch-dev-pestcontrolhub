
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);

CREATE TABLE IF NOT EXISTS public.client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','expirado','revogado')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_invitations_client ON public.client_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON public.client_invitations(lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_invitations TO authenticated;
GRANT ALL ON public.client_invitations TO service_role;
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time interno gerencia convites"
  ON public.client_invitations FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));

CREATE OR REPLACE FUNCTION public.current_portal_client_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "Cliente lê próprio cadastro"
  ON public.clients FOR SELECT
  USING (id = public.current_portal_client_id());

CREATE POLICY "Cliente lê suas propostas"
  ON public.proposals FOR SELECT
  USING (client_id = public.current_portal_client_id());

CREATE POLICY "Cliente lê suas OS"
  ON public.service_orders FOR SELECT
  USING (client_id = public.current_portal_client_id());

CREATE POLICY "Cliente lê seus recebíveis"
  ON public.accounts_receivable FOR SELECT
  USING (client_id = public.current_portal_client_id());

CREATE POLICY "Cliente lê baixas dos próprios títulos"
  ON public.financial_payments FOR SELECT
  USING (
    tipo = 'receber'
    AND EXISTS (
      SELECT 1 FROM public.accounts_receivable ar
      WHERE ar.id = financial_payments.receivable_id
        AND ar.client_id = public.current_portal_client_id()
    )
  );

CREATE OR REPLACE FUNCTION public.accept_client_invitation(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.client_invitations%ROWTYPE;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_invite FROM public.client_invitations WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido'; END IF;
  IF v_invite.status <> 'pendente' THEN RAISE EXCEPTION 'Convite indisponível'; END IF;
  IF v_invite.expires_at < now() THEN
    UPDATE public.client_invitations SET status = 'expirado' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Convite expirado';
  END IF;

  UPDATE public.profiles SET client_id = v_invite.client_id WHERE id = v_uid;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'cliente'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.client_invitations
    SET status = 'aceito', accepted_at = now()
    WHERE id = v_invite.id;

  RETURN v_invite.client_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_client_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_portal_client_id() TO authenticated;
