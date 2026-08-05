-- 1) RLS: leituras sensíveis restritas à equipe
DROP POLICY "Autenticados leem fornecedores" ON public.suppliers;
CREATE POLICY "Equipe le fornecedores" ON public.suppliers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));

DROP POLICY "Autenticados leem pedidos de compra" ON public.purchase_orders;
CREATE POLICY "Equipe le pedidos de compra" ON public.purchase_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));

DROP POLICY "Autenticados leem itens de pedidos de compra" ON public.purchase_order_items;
CREATE POLICY "Equipe le itens de pedidos de compra" ON public.purchase_order_items FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));

DROP POLICY "Autenticados leem vinculos produto-fornecedor" ON public.product_suppliers;
CREATE POLICY "Equipe le vinculos produto-fornecedor" ON public.product_suppliers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));

DROP POLICY "profiles_select_auth" ON public.profiles;
CREATE POLICY "profiles_select_self_or_staff" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));

-- 2) Funções SECURITY DEFINER: revoga execução pública e devolve só o necessário
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- leitura pública por token (links de relatório e certificado)
GRANT EXECUTE ON FUNCTION public.get_os_report_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_certificate_by_token(text) TO anon, authenticated;

-- auxiliares usados nas políticas de RLS
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_portal_client_id() TO anon, authenticated;

-- funções chamadas pelo app autenticado
GRANT EXECUTE ON FUNCTION public.accept_client_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_os_stock_deduction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order_item(uuid, text, date, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_overdue_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_financial_payment(financial_account_kind, uuid, numeric, date, payment_method, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_financial_dre(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_lead_funnel(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_os_throughput(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_payables_aging() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_proposal_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_receivables_aging() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_stock_critical() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_supplier_performance(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bi_team_productivity(date, date) TO authenticated;