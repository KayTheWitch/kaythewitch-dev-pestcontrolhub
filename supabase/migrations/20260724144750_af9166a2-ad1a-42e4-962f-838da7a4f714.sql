
CREATE OR REPLACE FUNCTION public.get_certificate_by_token(_token text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'numero_ces', c.numero_ces,
    'emitido_em', c.emitido_em,
    'ano', c.ano,
    'os', jsonb_build_object(
      'numero', so.numero,
      'data_execucao', so.checkout_at
    ),
    'cliente', jsonb_build_object(
      'nome', cl.nome,
      'documento', cl.documento,
      'endereco', cl.endereco,
      'cidade', cl.cidade,
      'estado', cl.estado
    ),
    'produtos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'nome', sop.nome,
        'lote', sop.lote,
        'quantidade_aplicada', sop.quantidade_aplicada,
        'unidade', sop.unidade,
        'principio_ativo', p.principio_ativo,
        'registro_ms', p.registro_ms,
        'classe_toxicologica', p.classe_toxicologica
      ))
      FROM public.service_order_products sop
      LEFT JOIN public.products p ON p.id = sop.product_id
      WHERE sop.service_order_id = so.id
    ), '[]'::jsonb),
    'rt', CASE WHEN otr.os_id IS NOT NULL THEN jsonb_build_object(
      'nome', otr.rt_nome,
      'conselho', otr.rt_conselho,
      'registro', otr.rt_registro,
      'art_numero', otr.art_numero,
      'art_validade', otr.art_validade
    ) ELSE NULL END
  )
  FROM public.service_certificates c
  JOIN public.service_orders so ON so.id = c.service_order_id
  LEFT JOIN public.clients cl ON cl.id = so.client_id
  LEFT JOIN public.os_technical_responsible otr ON otr.os_id = so.id
  WHERE c.token_publico = _token
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_certificate_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_certificate_by_token(text) TO anon, authenticated, service_role;

-- Snapshot RT automático + validação leve ao concluir OS
CREATE OR REPLACE FUNCTION public.trg_os_compliance_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rt public.technical_responsibles%ROWTYPE;
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status <> 'concluida') THEN
    IF NOT EXISTS (SELECT 1 FROM public.os_technical_responsible WHERE os_id = NEW.id) THEN
      SELECT * INTO _rt FROM public.technical_responsibles
       WHERE ativo AND (art_validade IS NULL OR art_validade >= CURRENT_DATE)
       ORDER BY updated_at DESC LIMIT 1;
      IF FOUND THEN
        INSERT INTO public.os_technical_responsible (os_id, rt_id, rt_nome, rt_conselho, rt_registro, art_numero, art_validade)
        VALUES (NEW.id, _rt.id, _rt.nome, _rt.conselho, _rt.registro, _rt.art_numero, _rt.art_validade);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.trg_os_compliance_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trg_os_compliance_snapshot() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_os_compliance_snapshot ON public.service_orders;
CREATE TRIGGER trg_os_compliance_snapshot
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_os_compliance_snapshot();
