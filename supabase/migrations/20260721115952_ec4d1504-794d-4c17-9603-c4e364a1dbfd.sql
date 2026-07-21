
-- Fase 7 — BI: funções agregadoras security definer, restritas a admin/comercial

CREATE OR REPLACE FUNCTION public._bi_assert_role()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN
    RAISE EXCEPTION 'Sem permissão para acessar BI';
  END IF;
END; $$;

-- 1) Funil de leads
CREATE OR REPLACE FUNCTION public.bi_lead_funnel(_from date, _to date)
RETURNS TABLE(status text, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT l.status::text, COUNT(*)::bigint
    FROM public.leads l
    WHERE l.created_at::date BETWEEN _from AND _to
    GROUP BY l.status
    ORDER BY 1;
END; $$;

-- 2) Métricas de propostas
CREATE OR REPLACE FUNCTION public.bi_proposal_metrics(_from date, _to date)
RETURNS TABLE(status text, total bigint, valor_total numeric, ticket_medio numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT p.status::text,
           COUNT(*)::bigint,
           COALESCE(SUM(p.total),0)::numeric,
           COALESCE(AVG(NULLIF(p.total,0)),0)::numeric
    FROM public.proposals p
    WHERE p.created_at::date BETWEEN _from AND _to
    GROUP BY p.status
    ORDER BY 1;
END; $$;

-- 3) Throughput de OS
CREATE OR REPLACE FUNCTION public.bi_os_throughput(_from date, _to date)
RETURNS TABLE(status text, total bigint, avg_execution_hours numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT so.status::text,
           COUNT(*)::bigint,
           COALESCE(AVG(EXTRACT(EPOCH FROM (so.checkout_at - so.checkin_at))/3600.0) FILTER (WHERE so.checkout_at IS NOT NULL AND so.checkin_at IS NOT NULL),0)::numeric
    FROM public.service_orders so
    WHERE so.created_at::date BETWEEN _from AND _to
    GROUP BY so.status
    ORDER BY 1;
END; $$;

-- 4) Produtividade por equipe
CREATE OR REPLACE FUNCTION public.bi_team_productivity(_from date, _to date)
RETURNS TABLE(team_id uuid, team_nome text, os_concluidas bigint, avg_field_hours numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT t.id, COALESCE(t.nome,'—') AS team_nome,
           COUNT(*) FILTER (WHERE so.status='concluida')::bigint,
           COALESCE(AVG(EXTRACT(EPOCH FROM (so.checkout_at - so.checkin_at))/3600.0) FILTER (WHERE so.checkout_at IS NOT NULL AND so.checkin_at IS NOT NULL),0)::numeric
    FROM public.service_orders so
    LEFT JOIN public.teams t ON t.id = so.team_id
    WHERE so.created_at::date BETWEEN _from AND _to
    GROUP BY t.id, t.nome
    ORDER BY 3 DESC NULLS LAST;
END; $$;

-- 5) Estoque crítico
CREATE OR REPLACE FUNCTION public.bi_stock_critical()
RETURNS TABLE(product_id uuid, produto text, saldo numeric, min_stock numeric, vencendo_30 numeric, vencendo_60 numeric, vencendo_90 numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT p.id, p.nome,
           COALESCE(SUM(b.quantity_on_hand),0)::numeric AS saldo,
           COALESCE(p.min_stock,0)::numeric,
           COALESCE(SUM(b.quantity_on_hand) FILTER (WHERE b.expiry_date IS NOT NULL AND b.expiry_date <= CURRENT_DATE + INTERVAL '30 days'),0)::numeric,
           COALESCE(SUM(b.quantity_on_hand) FILTER (WHERE b.expiry_date IS NOT NULL AND b.expiry_date <= CURRENT_DATE + INTERVAL '60 days'),0)::numeric,
           COALESCE(SUM(b.quantity_on_hand) FILTER (WHERE b.expiry_date IS NOT NULL AND b.expiry_date <= CURRENT_DATE + INTERVAL '90 days'),0)::numeric
    FROM public.products p
    LEFT JOIN public.product_batches b ON b.product_id = p.id AND b.active
    WHERE p.ativo
    GROUP BY p.id, p.nome, p.min_stock
    ORDER BY p.nome;
END; $$;

-- 6) Compras por fornecedor
CREATE OR REPLACE FUNCTION public.bi_supplier_performance(_from date, _to date)
RETURNS TABLE(supplier_id uuid, fornecedor text, pedidos bigint, total_comprado numeric, lead_time_medio_dias numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT s.id, s.razao_social,
           COUNT(po.*)::bigint,
           COALESCE(SUM(po.total),0)::numeric,
           COALESCE(AVG(EXTRACT(EPOCH FROM (po.data_recebimento::timestamp - po.created_at))/86400.0) FILTER (WHERE po.data_recebimento IS NOT NULL),0)::numeric
    FROM public.suppliers s
    LEFT JOIN public.purchase_orders po ON po.supplier_id = s.id AND po.created_at::date BETWEEN _from AND _to
    GROUP BY s.id, s.razao_social
    HAVING COUNT(po.*) > 0
    ORDER BY 4 DESC;
END; $$;

-- 7) DRE mensal simplificado (receita/despesa realizadas)
CREATE OR REPLACE FUNCTION public.bi_financial_dre(_from date, _to date)
RETURNS TABLE(mes date, receita numeric, despesa numeric, resultado numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    WITH months AS (
      SELECT generate_series(date_trunc('month', _from)::date, date_trunc('month', _to)::date, INTERVAL '1 month')::date AS mes
    ),
    pagamentos AS (
      SELECT date_trunc('month', fp.data_pagamento)::date AS mes,
             SUM(CASE WHEN fp.tipo='receber' THEN fp.valor ELSE 0 END) AS receita,
             SUM(CASE WHEN fp.tipo='pagar'   THEN fp.valor ELSE 0 END) AS despesa
      FROM public.financial_payments fp
      WHERE fp.data_pagamento BETWEEN _from AND _to
      GROUP BY 1
    )
    SELECT m.mes,
           COALESCE(p.receita,0)::numeric,
           COALESCE(p.despesa,0)::numeric,
           COALESCE(p.receita,0)::numeric - COALESCE(p.despesa,0)::numeric
    FROM months m LEFT JOIN pagamentos p ON p.mes = m.mes
    ORDER BY m.mes;
END; $$;

-- 8) Aging de contas a receber
CREATE OR REPLACE FUNCTION public.bi_receivables_aging()
RETURNS TABLE(bucket text, total bigint, valor numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT bucket, COUNT(*)::bigint, COALESCE(SUM(saldo),0)::numeric
    FROM (
      SELECT CASE
        WHEN data_vencimento >= CURRENT_DATE THEN 'a_vencer'
        WHEN CURRENT_DATE - data_vencimento BETWEEN 1 AND 30 THEN '1-30'
        WHEN CURRENT_DATE - data_vencimento BETWEEN 31 AND 60 THEN '31-60'
        WHEN CURRENT_DATE - data_vencimento BETWEEN 61 AND 90 THEN '61-90'
        ELSE '90+'
      END AS bucket,
      (valor_original - COALESCE(valor_pago,0)) AS saldo
      FROM public.accounts_receivable
      WHERE status IN ('aberto','vencido','parcialmente_pago')
    ) t GROUP BY bucket ORDER BY 1;
END; $$;

-- 9) Aging de contas a pagar
CREATE OR REPLACE FUNCTION public.bi_payables_aging()
RETURNS TABLE(bucket text, total bigint, valor numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._bi_assert_role();
  RETURN QUERY
    SELECT bucket, COUNT(*)::bigint, COALESCE(SUM(saldo),0)::numeric
    FROM (
      SELECT CASE
        WHEN data_vencimento >= CURRENT_DATE THEN 'a_vencer'
        WHEN CURRENT_DATE - data_vencimento BETWEEN 1 AND 30 THEN '1-30'
        WHEN CURRENT_DATE - data_vencimento BETWEEN 31 AND 60 THEN '31-60'
        WHEN CURRENT_DATE - data_vencimento BETWEEN 61 AND 90 THEN '61-90'
        ELSE '90+'
      END AS bucket,
      (valor_original - COALESCE(valor_pago,0)) AS saldo
      FROM public.accounts_payable
      WHERE status IN ('aberto','vencido','parcialmente_pago')
    ) t GROUP BY bucket ORDER BY 1;
END; $$;

-- Grants para chamada via PostgREST
GRANT EXECUTE ON FUNCTION public.bi_lead_funnel(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_proposal_metrics(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_os_throughput(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_team_productivity(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_stock_critical() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_supplier_performance(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_financial_dre(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_receivables_aging() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_payables_aging() TO authenticated;
