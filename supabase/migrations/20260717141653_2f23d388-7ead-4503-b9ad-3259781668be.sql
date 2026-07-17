
REVOKE EXECUTE ON FUNCTION public.create_receivable_from_os(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_receivable_from_os(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.upsert_payable_from_po(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.register_financial_payment(public.financial_account_kind, uuid, numeric, date, public.payment_method, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.refresh_overdue_accounts() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.register_financial_payment(public.financial_account_kind, uuid, numeric, date, public.payment_method, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_overdue_accounts() TO authenticated;
