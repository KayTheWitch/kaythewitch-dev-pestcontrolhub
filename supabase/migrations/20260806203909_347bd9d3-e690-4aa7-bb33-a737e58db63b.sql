-- =========================================================
-- 1. Guard helper: only internal staff may delete records
-- =========================================================
CREATE OR REPLACE FUNCTION public._assert_staff()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN
    RAISE EXCEPTION 'Sem permissão para excluir registros';
  END IF;
END; $$;

-- =========================================================
-- 2. Safe delete functions (block when history exists)
-- =========================================================
CREATE OR REPLACE FUNCTION public.delete_lead(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.diagnostics WHERE lead_id = _id) THEN
    RAISE EXCEPTION 'Este lead possui diagnóstico vinculado e não pode ser excluído.';
  END IF;
  DELETE FROM public.leads WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_client(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.service_orders WHERE client_id = _id) THEN
    RAISE EXCEPTION 'Cliente possui ordens de serviço e não pode ser excluído. Considere inativá-lo.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.proposals WHERE client_id = _id) THEN
    RAISE EXCEPTION 'Cliente possui propostas e não pode ser excluído. Considere inativá-lo.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.accounts_receivable WHERE client_id = _id) THEN
    RAISE EXCEPTION 'Cliente possui títulos financeiros e não pode ser excluído.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.diagnostics WHERE client_id = _id) THEN
    RAISE EXCEPTION 'Cliente possui diagnósticos vinculados e não pode ser excluído.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE client_id = _id) THEN
    RAISE EXCEPTION 'Cliente possui usuário de portal vinculado. Remova o acesso antes de excluir.';
  END IF;
  UPDATE public.leads SET client_id = NULL WHERE client_id = _id;
  DELETE FROM public.client_invitations WHERE client_id = _id;
  DELETE FROM public.client_units WHERE client_id = _id;
  DELETE FROM public.clients WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_diagnostic(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.proposals WHERE diagnostic_id = _id) THEN
    RAISE EXCEPTION 'Diagnóstico possui proposta vinculada e não pode ser excluído.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.service_orders WHERE diagnostic_id = _id) THEN
    RAISE EXCEPTION 'Diagnóstico possui OS vinculada e não pode ser excluído.';
  END IF;
  DELETE FROM public.diagnostics WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_proposal(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.service_orders WHERE proposal_id = _id) THEN
    RAISE EXCEPTION 'Proposta possui OS gerada e não pode ser excluída.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.accounts_receivable WHERE proposal_id = _id) THEN
    RAISE EXCEPTION 'Proposta possui título financeiro vinculado e não pode ser excluída.';
  END IF;
  DELETE FROM public.proposals WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_product(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.stock_movements WHERE product_id = _id) THEN
    RAISE EXCEPTION 'Produto possui movimentação de estoque e não pode ser excluído. Considere inativá-lo.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.product_batches WHERE product_id = _id) THEN
    RAISE EXCEPTION 'Produto possui lotes cadastrados e não pode ser excluído. Considere inativá-lo.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.service_order_products WHERE product_id = _id) THEN
    RAISE EXCEPTION 'Produto já foi utilizado em OS e não pode ser excluído. Considere inativá-lo.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.purchase_order_items WHERE product_id = _id) THEN
    RAISE EXCEPTION 'Produto consta em pedidos de compra e não pode ser excluído.';
  END IF;
  DELETE FROM public.regulatory_documents WHERE product_id = _id;
  DELETE FROM public.product_suppliers WHERE product_id = _id;
  DELETE FROM public.products WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_service_catalog_item(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  DELETE FROM public.service_catalog WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_team(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.service_orders WHERE team_id = _id) THEN
    RAISE EXCEPTION 'Equipe possui OS vinculadas e não pode ser excluída. Considere inativá-la.';
  END IF;
  DELETE FROM public.schedule_blocks WHERE team_id = _id;
  DELETE FROM public.teams WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_epi(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.epi_deliveries WHERE epi_id = _id) THEN
    RAISE EXCEPTION 'EPI possui entregas registradas e não pode ser excluído. Considere inativá-lo.';
  END IF;
  DELETE FROM public.epis WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_financial_category(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.accounts_receivable WHERE categoria_id = _id)
     OR EXISTS (SELECT 1 FROM public.accounts_payable WHERE categoria_id = _id) THEN
    RAISE EXCEPTION 'Categoria está em uso em títulos financeiros. Considere inativá-la.';
  END IF;
  DELETE FROM public.financial_categories WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_supplier(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.purchase_orders WHERE supplier_id = _id) THEN
    RAISE EXCEPTION 'Fornecedor possui pedidos de compra e não pode ser excluído. Considere inativá-lo.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.product_batches WHERE supplier_id = _id) THEN
    RAISE EXCEPTION 'Fornecedor possui lotes de estoque vinculados e não pode ser excluído.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.accounts_payable WHERE supplier_id = _id) THEN
    RAISE EXCEPTION 'Fornecedor possui títulos a pagar e não pode ser excluído.';
  END IF;
  DELETE FROM public.product_suppliers WHERE supplier_id = _id;
  DELETE FROM public.suppliers WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_technical_responsible(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._assert_staff();
  IF EXISTS (SELECT 1 FROM public.os_technical_responsible WHERE rt_id = _id) THEN
    RAISE EXCEPTION 'Responsável técnico consta em OS concluídas e não pode ser excluído. Considere inativá-lo.';
  END IF;
  DELETE FROM public.technical_responsibles WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_service_order(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _st public.os_status;
BEGIN
  PERFORM public._assert_staff();
  SELECT status INTO _st FROM public.service_orders WHERE id = _id;
  IF _st IS NULL THEN RAISE EXCEPTION 'OS não encontrada'; END IF;
  IF _st = 'concluida' THEN
    RAISE EXCEPTION 'OS concluída não pode ser excluída, apenas cancelada.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.stock_movements WHERE service_order_id = _id) THEN
    RAISE EXCEPTION 'OS possui movimentação de estoque e não pode ser excluída.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.accounts_receivable WHERE service_order_id = _id) THEN
    RAISE EXCEPTION 'OS possui título financeiro vinculado e não pode ser excluída.';
  END IF;
  DELETE FROM public.service_order_products WHERE service_order_id = _id;
  DELETE FROM public.service_order_photos WHERE service_order_id = _id;
  DELETE FROM public.service_order_events WHERE service_order_id = _id;
  DELETE FROM public.os_technical_responsible WHERE os_id = _id;
  DELETE FROM public.service_orders WHERE id = _id;
END; $$;

-- =========================================================
-- 3. Function privileges
-- =========================================================
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN
    SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      '_assert_staff','delete_lead','delete_client','delete_diagnostic','delete_proposal',
      'delete_product','delete_service_catalog_item','delete_team','delete_epi',
      'delete_financial_category','delete_supplier','delete_technical_responsible',
      'delete_service_order')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;

-- =========================================================
-- 4. Admin management of user roles
-- =========================================================
DROP POLICY IF EXISTS user_roles_admin_select ON public.user_roles;
CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS user_roles_admin_insert ON public.user_roles;
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;
CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;

-- Never let an admin strip their own admin role (avoids lockout)
CREATE OR REPLACE FUNCTION public.prevent_self_admin_removal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role = 'admin' AND OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio papel de administrador.';
  END IF;
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trg_prevent_self_admin_removal ON public.user_roles;
CREATE TRIGGER trg_prevent_self_admin_removal
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_admin_removal();

-- Admins may read all profiles (already allowed) and update names
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
