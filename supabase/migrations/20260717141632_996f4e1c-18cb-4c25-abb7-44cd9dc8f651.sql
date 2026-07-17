
-- 1. ENUMS
CREATE TYPE public.financial_category_type AS ENUM ('receita','despesa');
CREATE TYPE public.financial_account_status AS ENUM ('aberto','parcialmente_pago','pago','vencido','cancelado');
CREATE TYPE public.payment_method AS ENUM ('pix','boleto','dinheiro','cartao','transferencia','outro');
CREATE TYPE public.financial_account_kind AS ENUM ('receber','pagar');

-- 2. PLANO DE CONTAS
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo public.financial_category_type NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_categories TO authenticated;
GRANT ALL ON public.financial_categories TO service_role;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_cat_read" ON public.financial_categories FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));
CREATE POLICY "fin_cat_admin_write" ON public.financial_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_fin_cat_updated BEFORE UPDATE ON public.financial_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed
INSERT INTO public.financial_categories (tipo, slug, nome) VALUES
  ('receita','receita_servico','Receita de Serviço'),
  ('receita','receita_outros','Outras Receitas'),
  ('despesa','despesa_produto','Compra de Produtos'),
  ('despesa','despesa_operacional','Despesas Operacionais'),
  ('despesa','despesa_folha','Folha de Pagamento'),
  ('despesa','despesa_imposto','Impostos e Taxas'),
  ('despesa','despesa_outros','Outras Despesas');

-- 3. SEQUÊNCIAS PARA NUMERAÇÃO
CREATE SEQUENCE IF NOT EXISTS public.receivable_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.payable_number_seq START 1;

-- 4. CONTAS A RECEBER
CREATE TABLE public.accounts_receivable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  service_order_id UUID UNIQUE REFERENCES public.service_orders(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.financial_categories(id),
  descricao TEXT NOT NULL,
  valor_original NUMERIC(12,2) NOT NULL CHECK (valor_original >= 0),
  valor_pago NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  forma_pagamento public.payment_method,
  status public.financial_account_status NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ar_status ON public.accounts_receivable(status);
CREATE INDEX idx_ar_vencimento ON public.accounts_receivable(data_vencimento);
CREATE INDEX idx_ar_client ON public.accounts_receivable(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts_receivable TO authenticated;
GRANT ALL ON public.accounts_receivable TO service_role;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar_access" ON public.accounts_receivable FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));
CREATE TRIGGER trg_ar_updated BEFORE UPDATE ON public.accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. CONTAS A PAGAR
CREATE TABLE public.accounts_payable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.financial_categories(id),
  descricao TEXT NOT NULL,
  valor_original NUMERIC(12,2) NOT NULL CHECK (valor_original >= 0),
  valor_pago NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  forma_pagamento public.payment_method,
  status public.financial_account_status NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_ap_po_unique ON public.accounts_payable(purchase_order_id) WHERE purchase_order_id IS NOT NULL;
CREATE INDEX idx_ap_status ON public.accounts_payable(status);
CREATE INDEX idx_ap_vencimento ON public.accounts_payable(data_vencimento);
CREATE INDEX idx_ap_supplier ON public.accounts_payable(supplier_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts_payable TO authenticated;
GRANT ALL ON public.accounts_payable TO service_role;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ap_access" ON public.accounts_payable FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));
CREATE TRIGGER trg_ap_updated BEFORE UPDATE ON public.accounts_payable
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. PAGAMENTOS
CREATE TABLE public.financial_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo public.financial_account_kind NOT NULL,
  receivable_id UUID REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  payable_id UUID REFERENCES public.accounts_payable(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento public.payment_method NOT NULL,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((tipo='receber' AND receivable_id IS NOT NULL AND payable_id IS NULL)
      OR (tipo='pagar'   AND payable_id IS NOT NULL AND receivable_id IS NULL))
);
CREATE INDEX idx_fp_receivable ON public.financial_payments(receivable_id);
CREATE INDEX idx_fp_payable ON public.financial_payments(payable_id);
CREATE INDEX idx_fp_data ON public.financial_payments(data_pagamento);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_payments TO authenticated;
GRANT ALL ON public.financial_payments TO service_role;
ALTER TABLE public.financial_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fp_access" ON public.financial_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));

-- 7. FUNÇÕES DE AUTOMAÇÃO

-- Cria receivable ao concluir OS (idempotente por service_order_id)
CREATE OR REPLACE FUNCTION public.create_receivable_from_os(_os_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _os service_orders%ROWTYPE;
  _proposal proposals%ROWTYPE;
  _cat_id UUID;
  _ar_id UUID;
  _numero TEXT;
BEGIN
  SELECT id INTO _ar_id FROM accounts_receivable WHERE service_order_id = _os_id;
  IF _ar_id IS NOT NULL THEN RETURN _ar_id; END IF;

  SELECT * INTO _os FROM service_orders WHERE id = _os_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'OS não encontrada'; END IF;

  SELECT * INTO _proposal FROM proposals WHERE id = _os.proposal_id;
  SELECT id INTO _cat_id FROM financial_categories WHERE slug='receita_servico' LIMIT 1;
  _numero := 'CR-' || LPAD(nextval('receivable_number_seq')::text, 6, '0');

  INSERT INTO accounts_receivable (
    numero, client_id, service_order_id, proposal_id, categoria_id,
    descricao, valor_original, data_emissao, data_vencimento, created_by
  ) VALUES (
    _numero, _os.client_id, _os.id, _os.proposal_id, _cat_id,
    'Serviço da OS #' || _os.numero::text,
    COALESCE(_proposal.total, 0),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '15 days',
    auth.uid()
  ) RETURNING id INTO _ar_id;

  RETURN _ar_id;
END; $$;

-- Cancela receivable se OS for reaberta (só se ainda estiver aberto e sem baixa)
CREATE OR REPLACE FUNCTION public.cancel_receivable_from_os(_os_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE accounts_receivable
     SET status = 'cancelado', updated_at = now()
   WHERE service_order_id = _os_id
     AND status = 'aberto'
     AND valor_pago = 0;
END; $$;

-- Upsert de payable a partir de PC (idempotente por purchase_order_id)
CREATE OR REPLACE FUNCTION public.upsert_payable_from_po(_po_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _po purchase_orders%ROWTYPE;
  _ap_id UUID;
  _cat_id UUID;
  _numero TEXT;
  _valor NUMERIC;
BEGIN
  SELECT * INTO _po FROM purchase_orders WHERE id = _po_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- valor baseado no que foi efetivamente recebido
  SELECT COALESCE(SUM(quantidade_recebida * custo_unitario), 0)
    INTO _valor
    FROM purchase_order_items WHERE purchase_order_id = _po_id;

  IF _valor <= 0 THEN RETURN NULL; END IF;

  SELECT id INTO _ap_id FROM accounts_payable WHERE purchase_order_id = _po_id;
  SELECT id INTO _cat_id FROM financial_categories WHERE slug='despesa_produto' LIMIT 1;

  IF _ap_id IS NULL THEN
    _numero := 'CP-' || LPAD(nextval('payable_number_seq')::text, 6, '0');
    INSERT INTO accounts_payable (
      numero, supplier_id, purchase_order_id, categoria_id,
      descricao, valor_original, data_emissao, data_vencimento, created_by
    ) VALUES (
      _numero, _po.supplier_id, _po.id, _cat_id,
      'Pedido de compra ' || _po.numero,
      _valor, CURRENT_DATE,
      COALESCE(_po.data_prevista, CURRENT_DATE + INTERVAL '30 days'),
      auth.uid()
    ) RETURNING id INTO _ap_id;
  ELSE
    -- atualiza valor se pedido ainda está aberto e sem baixa
    UPDATE accounts_payable
       SET valor_original = _valor, updated_at = now()
     WHERE id = _ap_id AND status IN ('aberto','vencido') AND valor_pago = 0;
  END IF;

  RETURN _ap_id;
END; $$;

-- 8. TRIGGERS DE INTEGRAÇÃO

-- OS: status → concluida gera receivable; concluida → outro estado cancela
CREATE OR REPLACE FUNCTION public.trg_os_financial_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status <> 'concluida') THEN
    PERFORM public.create_receivable_from_os(NEW.id);
  ELSIF OLD.status = 'concluida' AND NEW.status <> 'concluida' THEN
    PERFORM public.cancel_receivable_from_os(NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_os_financial_sync
  AFTER UPDATE OF status ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_os_financial_sync();

-- PC: status recebido / recebido_parcial gera payable
CREATE OR REPLACE FUNCTION public.trg_po_financial_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('recebido','recebido_parcial')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('recebido','recebido_parcial')
          OR NEW.status <> OLD.status) THEN
    PERFORM public.upsert_payable_from_po(NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_po_financial_sync
  AFTER UPDATE OF status ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_po_financial_sync();

-- 9. FUNÇÃO DE BAIXA DE PAGAMENTO
CREATE OR REPLACE FUNCTION public.register_financial_payment(
  _tipo public.financial_account_kind,
  _account_id UUID,
  _valor NUMERIC,
  _data_pagamento DATE,
  _forma public.payment_method,
  _obs TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pay_id UUID;
  _valor_original NUMERIC;
  _valor_pago NUMERIC;
  _novo_pago NUMERIC;
  _novo_status public.financial_account_status;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN
    RAISE EXCEPTION 'Sem permissão para registrar pagamento';
  END IF;
  IF _valor <= 0 THEN RAISE EXCEPTION 'Valor deve ser maior que zero'; END IF;

  IF _tipo = 'receber' THEN
    SELECT valor_original, valor_pago INTO _valor_original, _valor_pago
      FROM accounts_receivable WHERE id = _account_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Título não encontrado'; END IF;
    _novo_pago := _valor_pago + _valor;
    IF _novo_pago > _valor_original THEN RAISE EXCEPTION 'Pagamento excede o valor do título'; END IF;
    _novo_status := CASE WHEN _novo_pago >= _valor_original THEN 'pago'::public.financial_account_status
                         ELSE 'parcialmente_pago'::public.financial_account_status END;

    INSERT INTO financial_payments (tipo, receivable_id, valor, data_pagamento, forma_pagamento, observacoes, user_id)
    VALUES ('receber', _account_id, _valor, _data_pagamento, _forma, _obs, auth.uid())
    RETURNING id INTO _pay_id;

    UPDATE accounts_receivable
       SET valor_pago = _novo_pago,
           status = _novo_status,
           forma_pagamento = _forma,
           data_pagamento = CASE WHEN _novo_status = 'pago' THEN _data_pagamento ELSE data_pagamento END,
           updated_at = now()
     WHERE id = _account_id;
  ELSE
    SELECT valor_original, valor_pago INTO _valor_original, _valor_pago
      FROM accounts_payable WHERE id = _account_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Título não encontrado'; END IF;
    _novo_pago := _valor_pago + _valor;
    IF _novo_pago > _valor_original THEN RAISE EXCEPTION 'Pagamento excede o valor do título'; END IF;
    _novo_status := CASE WHEN _novo_pago >= _valor_original THEN 'pago'::public.financial_account_status
                         ELSE 'parcialmente_pago'::public.financial_account_status END;

    INSERT INTO financial_payments (tipo, payable_id, valor, data_pagamento, forma_pagamento, observacoes, user_id)
    VALUES ('pagar', _account_id, _valor, _data_pagamento, _forma, _obs, auth.uid())
    RETURNING id INTO _pay_id;

    UPDATE accounts_payable
       SET valor_pago = _novo_pago,
           status = _novo_status,
           forma_pagamento = _forma,
           data_pagamento = CASE WHEN _novo_status = 'pago' THEN _data_pagamento ELSE data_pagamento END,
           updated_at = now()
     WHERE id = _account_id;
  END IF;

  RETURN _pay_id;
END; $$;

-- 10. FUNÇÃO PARA MARCAR VENCIDOS (chamada sob demanda pelo dashboard)
CREATE OR REPLACE FUNCTION public.refresh_overdue_accounts()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE accounts_receivable
     SET status='vencido', updated_at=now()
   WHERE status IN ('aberto','parcialmente_pago')
     AND data_vencimento < CURRENT_DATE;
  UPDATE accounts_payable
     SET status='vencido', updated_at=now()
   WHERE status IN ('aberto','parcialmente_pago')
     AND data_vencimento < CURRENT_DATE;
END; $$;
