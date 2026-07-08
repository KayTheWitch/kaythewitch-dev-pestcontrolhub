
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'comercial');
CREATE TYPE public.client_type AS ENUM ('PF', 'PJ');
CREATE TYPE public.client_category AS ENUM ('residencial', 'comercial', 'industrial', 'condominio');
CREATE TYPE public.service_type AS ENUM ('controle_pragas', 'higienizacao_reservatorio');
CREATE TYPE public.lead_origin AS ENUM ('telefone', 'whatsapp', 'site', 'email', 'indicacao', 'retorno');
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_diagnostico', 'proposta_enviada', 'ganho', 'perdido');
CREATE TYPE public.proposal_status AS ENUM ('rascunho', 'enviada', 'em_assinatura', 'aprovada', 'recusada', 'expirada');
CREATE TYPE public.os_status AS ENUM ('aguardando_execucao', 'em_execucao', 'concluida', 'cancelada');
CREATE TYPE public.urgency AS ENUM ('baixa', 'media', 'alta');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

-- Trigger to create profile + grant first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'comercial');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'comercial');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SHARED updated_at ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ CLIENTS ============
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.client_type NOT NULL DEFAULT 'PF',
  documento TEXT,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  categoria public.client_category NOT NULL DEFAULT 'residencial',
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  responsavel TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_all" ON public.clients FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CLIENT UNITS ============
CREATE TABLE public.client_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients ON DELETE CASCADE,
  nome TEXT NOT NULL,
  endereco TEXT,
  responsavel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_units TO authenticated;
GRANT ALL ON public.client_units TO service_role;
ALTER TABLE public.client_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_units_all" ON public.client_units FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

-- ============ LEADS ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  nome_contato TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  origem public.lead_origin NOT NULL DEFAULT 'telefone',
  status public.lead_status NOT NULL DEFAULT 'novo',
  notas TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_all" ON public.leads FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SERVICE CATALOG ============
CREATE TABLE public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.service_type NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'servico',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_catalog TO authenticated;
GRANT ALL ON public.service_catalog TO service_role;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_catalog_all" ON public.service_catalog FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

-- ============ DIAGNOSTICS ============
CREATE TABLE public.diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients ON DELETE CASCADE,
  tipo_servico public.service_type NOT NULL,
  praga_necessidade TEXT,
  area_m2 NUMERIC(12,2),
  volume_l NUMERIC(12,2),
  periodicidade TEXT,
  urgencia public.urgency NOT NULL DEFAULT 'media',
  classificacao public.client_category NOT NULL DEFAULT 'residencial',
  precisa_visita BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostics TO authenticated;
GRANT ALL ON public.diagnostics TO service_role;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diagnostics_all" ON public.diagnostics FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

-- ============ PROPOSALS ============
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  diagnostic_id UUID REFERENCES public.diagnostics ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients ON DELETE CASCADE,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  margem_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  validade_dias INT NOT NULL DEFAULT 15,
  status public.proposal_status NOT NULL DEFAULT 'rascunho',
  observacoes TEXT,
  lgpd_aceite BOOLEAN NOT NULL DEFAULT false,
  signature_provider TEXT,
  signature_doc_id TEXT,
  signature_url TEXT,
  signed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_all" ON public.proposals FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TEAMS ============
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  membros JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_all" ON public.teams FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  principio_ativo TEXT,
  registro_ms TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_all" ON public.products FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

-- ============ EPIs ============
CREATE TABLE public.epis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ca TEXT,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis TO authenticated;
GRANT ALL ON public.epis TO service_role;
ALTER TABLE public.epis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epis_all" ON public.epis FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

-- ============ SERVICE ORDERS ============
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  proposal_id UUID REFERENCES public.proposals ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients ON DELETE CASCADE,
  diagnostic_id UUID REFERENCES public.diagnostics ON DELETE SET NULL,
  data_prevista DATE,
  team_id UUID REFERENCES public.teams ON DELETE SET NULL,
  responsavel TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  produtos_previstos JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipamentos JSONB NOT NULL DEFAULT '[]'::jsonb,
  epis JSONB NOT NULL DEFAULT '[]'::jsonb,
  instrucoes TEXT,
  observacoes TEXT,
  status public.os_status NOT NULL DEFAULT 'aguardando_execucao',
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_orders_all" ON public.service_orders FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE TRIGGER service_orders_updated_at BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users,
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid()));

-- ============ SEED CATALOG ============
INSERT INTO public.service_catalog (tipo, nome, descricao, preco_base, unidade) VALUES
  ('controle_pragas', 'Dedetização residencial', 'Controle de pragas urbanas (baratas, formigas, aranhas)', 350.00, 'servico'),
  ('controle_pragas', 'Desratização', 'Controle de roedores com iscas e monitoramento', 480.00, 'servico'),
  ('controle_pragas', 'Descupinização', 'Tratamento localizado ou preventivo contra cupins', 850.00, 'servico'),
  ('higienizacao_reservatorio', 'Limpeza de caixa d''água até 1000L', 'Higienização com laudo técnico', 280.00, 'reservatorio'),
  ('higienizacao_reservatorio', 'Limpeza de caixa d''água 1001-5000L', 'Higienização com laudo técnico', 480.00, 'reservatorio'),
  ('higienizacao_reservatorio', 'Limpeza de cisterna', 'Higienização de cisternas subterrâneas', 750.00, 'reservatorio');

INSERT INTO public.products (nome, principio_ativo, registro_ms, unidade) VALUES
  ('Cipermetrina 20 EC', 'Cipermetrina', 'MS 3.2456.0001', 'L'),
  ('Fipronil Gel', 'Fipronil 0,05%', 'MS 3.5678.0002', 'g'),
  ('Isca Parafinada Rodenticida', 'Brodifacoum 0,005%', 'MS 3.8765.0003', 'kg'),
  ('Hipoclorito de Sódio 10%', 'NaClO', 'ANVISA 25351', 'L');

INSERT INTO public.epis (nome, ca, descricao) VALUES
  ('Máscara respiratória PFF2', 'CA 12345', 'Proteção contra vapores químicos'),
  ('Luva nitrílica', 'CA 23456', 'Proteção química'),
  ('Óculos de segurança', 'CA 34567', 'Proteção ocular'),
  ('Macacão TNT', 'CA 45678', 'Proteção do corpo');
