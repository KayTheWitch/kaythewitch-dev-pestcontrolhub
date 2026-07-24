
-- ============================================================================
-- FASE 8 — Compliance ANVISA
-- ============================================================================

-- 1) Colunas regulatórias em products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS registro_ms text,
  ADD COLUMN IF NOT EXISTS classe_toxicologica text,
  ADD COLUMN IF NOT EXISTS grupo_quimico text,
  ADD COLUMN IF NOT EXISTS principio_ativo text,
  ADD COLUMN IF NOT EXISTS antidoto text,
  ADD COLUMN IF NOT EXISTS telefone_cit text;

-- 2) regulatory_documents
CREATE TABLE IF NOT EXISTS public.regulatory_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('registro_ms','fispq','bula','outro')),
  numero text,
  validade date,
  arquivo_path text,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regulatory_documents TO authenticated;
GRANT ALL ON public.regulatory_documents TO service_role;
ALTER TABLE public.regulatory_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage regulatory_documents"
  ON public.regulatory_documents FOR ALL
  USING (public.has_any_role(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER trg_regdocs_updated_at BEFORE UPDATE ON public.regulatory_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_regdocs_product ON public.regulatory_documents(product_id);

-- 3) technical_responsibles
CREATE TABLE IF NOT EXISTS public.technical_responsibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  conselho text NOT NULL CHECK (conselho IN ('CREA','CRQ','CRBio','CRMV','Outro')),
  registro text NOT NULL,
  art_numero text,
  art_validade date,
  art_pdf_path text,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_responsibles TO authenticated;
GRANT ALL ON public.technical_responsibles TO service_role;
ALTER TABLE public.technical_responsibles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage technical_responsibles"
  ON public.technical_responsibles FOR ALL
  USING (public.has_any_role(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER trg_rt_updated_at BEFORE UPDATE ON public.technical_responsibles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) os_technical_responsible (snapshot histórico)
CREATE TABLE IF NOT EXISTS public.os_technical_responsible (
  os_id uuid PRIMARY KEY REFERENCES public.service_orders(id) ON DELETE CASCADE,
  rt_id uuid NOT NULL REFERENCES public.technical_responsibles(id),
  rt_nome text NOT NULL,
  rt_conselho text NOT NULL,
  rt_registro text NOT NULL,
  art_numero text,
  art_validade date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.os_technical_responsible TO authenticated;
GRANT ALL ON public.os_technical_responsible TO service_role;
ALTER TABLE public.os_technical_responsible ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage os_technical_responsible"
  ON public.os_technical_responsible FOR ALL
  USING (public.has_any_role(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid()));

-- 5) service_certificates (CES) + sequência anual
CREATE SEQUENCE IF NOT EXISTS public.ces_seq;

CREATE TABLE IF NOT EXISTS public.service_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL UNIQUE REFERENCES public.service_orders(id) ON DELETE CASCADE,
  numero_ces text NOT NULL UNIQUE,
  ano int NOT NULL,
  seq int NOT NULL,
  token_publico text NOT NULL UNIQUE,
  emitido_em timestamptz NOT NULL DEFAULT now(),
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_certificates TO authenticated;
GRANT SELECT ON public.service_certificates TO anon; -- verificação pública por token
GRANT ALL ON public.service_certificates TO service_role;
ALTER TABLE public.service_certificates ENABLE ROW LEVEL SECURITY;

-- Staff enxerga tudo
CREATE POLICY "Staff manage service_certificates"
  ON public.service_certificates FOR ALL
  USING (public.has_any_role(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid()));

-- Cliente do portal enxerga apenas os certificados de suas OS
CREATE POLICY "Portal client reads own certificates"
  ON public.service_certificates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_order_id
        AND so.client_id = public.current_portal_client_id()
    )
  );

-- Verificação pública por token (rota /ces/:token) — RLS permite anon SELECT
-- (SELECT em toda a tabela para anon seria excessivo; usamos server function que consulta com service role)
-- Portanto NÃO criamos policy anon SELECT genérica; deixamos que a rota use supabaseAdmin com filtro por token.
-- Reverter grant SELECT amplo para anon:
REVOKE SELECT ON public.service_certificates FROM anon;

CREATE INDEX IF NOT EXISTS idx_ces_ano_seq ON public.service_certificates(ano, seq);

-- Função para emitir CES
CREATE OR REPLACE FUNCTION public.issue_service_certificate(_os_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing uuid;
  _ano int := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  _seq int;
  _numero text;
  _token text;
  _cert_id uuid;
BEGIN
  SELECT id INTO _existing FROM public.service_certificates WHERE service_order_id = _os_id;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;

  _seq := nextval('public.ces_seq');
  _numero := 'CES-' || _ano::text || '-' || LPAD(_seq::text, 6, '0');
  _token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.service_certificates (service_order_id, numero_ces, ano, seq, token_publico)
  VALUES (_os_id, _numero, _ano, _seq, _token)
  RETURNING id INTO _cert_id;

  RETURN _cert_id;
END;
$$;

-- Trigger: ao concluir OS, emite CES automaticamente
CREATE OR REPLACE FUNCTION public.trg_os_issue_ces()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status <> 'concluida') THEN
    PERFORM public.issue_service_certificate(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_issue_ces ON public.service_orders;
CREATE TRIGGER trg_os_issue_ces
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_os_issue_ces();

-- 6) epi_deliveries
CREATE TABLE IF NOT EXISTS public.epi_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  epi_id uuid NOT NULL REFERENCES public.epis(id),
  ca text,
  quantidade numeric(10,2) NOT NULL DEFAULT 1,
  entregue_em date NOT NULL DEFAULT CURRENT_DATE,
  validade date,
  ficha_pdf_path text,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epi_deliveries TO authenticated;
GRANT ALL ON public.epi_deliveries TO service_role;
ALTER TABLE public.epi_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage epi_deliveries"
  ON public.epi_deliveries FOR ALL
  USING (public.has_any_role(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER trg_epi_deliv_updated_at BEFORE UPDATE ON public.epi_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_epi_deliv_user ON public.epi_deliveries(user_id);

-- 7) packaging_returns
CREATE TABLE IF NOT EXISTS public.packaging_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  quantidade numeric(10,2) NOT NULL,
  devolvido_em date NOT NULL DEFAULT CURRENT_DATE,
  comprovante_path text,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packaging_returns TO authenticated;
GRANT ALL ON public.packaging_returns TO service_role;
ALTER TABLE public.packaging_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage packaging_returns"
  ON public.packaging_returns FOR ALL
  USING (public.has_any_role(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER trg_pkg_ret_updated_at BEFORE UPDATE ON public.packaging_returns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
