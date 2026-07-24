
REVOKE EXECUTE ON FUNCTION public.issue_service_certificate(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trg_os_issue_ces() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_service_certificate(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trg_os_issue_ces() TO authenticated, service_role;
