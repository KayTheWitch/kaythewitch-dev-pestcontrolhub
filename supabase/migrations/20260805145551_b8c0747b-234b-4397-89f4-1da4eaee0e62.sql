-- Políticas que dependem de papel: limitar a usuários autenticados
DROP POLICY "Staff manage epi_deliveries" ON public.epi_deliveries;
CREATE POLICY "Staff manage epi_deliveries" ON public.epi_deliveries FOR ALL TO authenticated
USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

DROP POLICY "Staff manage service_certificates" ON public.service_certificates;
CREATE POLICY "Staff manage service_certificates" ON public.service_certificates FOR ALL TO authenticated
USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

DROP POLICY "Staff manage regulatory_documents" ON public.regulatory_documents;
CREATE POLICY "Staff manage regulatory_documents" ON public.regulatory_documents FOR ALL TO authenticated
USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

DROP POLICY "Staff manage technical_responsibles" ON public.technical_responsibles;
CREATE POLICY "Staff manage technical_responsibles" ON public.technical_responsibles FOR ALL TO authenticated
USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

DROP POLICY "Staff manage os_technical_responsible" ON public.os_technical_responsible;
CREATE POLICY "Staff manage os_technical_responsible" ON public.os_technical_responsible FOR ALL TO authenticated
USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

DROP POLICY "Staff manage packaging_returns" ON public.packaging_returns;
CREATE POLICY "Staff manage packaging_returns" ON public.packaging_returns FOR ALL TO authenticated
USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));

DROP POLICY "Time interno gerencia convites" ON public.client_invitations;
CREATE POLICY "Time interno gerencia convites" ON public.client_invitations FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));

DROP POLICY "Cliente lê próprio cadastro" ON public.clients;
CREATE POLICY "Cliente lê próprio cadastro" ON public.clients FOR SELECT TO authenticated
USING (id = public.current_portal_client_id());

DROP POLICY "Cliente lê suas propostas" ON public.proposals;
CREATE POLICY "Cliente lê suas propostas" ON public.proposals FOR SELECT TO authenticated
USING (client_id = public.current_portal_client_id());

DROP POLICY "Cliente lê suas OS" ON public.service_orders;
CREATE POLICY "Cliente lê suas OS" ON public.service_orders FOR SELECT TO authenticated
USING (client_id = public.current_portal_client_id());

DROP POLICY "Cliente lê seus recebíveis" ON public.accounts_receivable;
CREATE POLICY "Cliente lê seus recebíveis" ON public.accounts_receivable FOR SELECT TO authenticated
USING (client_id = public.current_portal_client_id());

DROP POLICY "Cliente lê baixas dos próprios títulos" ON public.financial_payments;
CREATE POLICY "Cliente lê baixas dos próprios títulos" ON public.financial_payments FOR SELECT TO authenticated
USING (tipo = 'receber'::financial_account_kind AND EXISTS (
  SELECT 1 FROM public.accounts_receivable ar
   WHERE ar.id = financial_payments.receivable_id
     AND ar.client_id = public.current_portal_client_id()
));

-- Remove execução herdada de PUBLIC em todas as funções do schema
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Leitura pública por token
GRANT EXECUTE ON FUNCTION public.get_os_report_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_certificate_by_token(text) TO anon, authenticated;

-- Auxiliares de papel usados nas políticas (apenas autenticados)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_portal_client_id() TO authenticated;

-- Funções chamadas pelo app autenticado
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
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;