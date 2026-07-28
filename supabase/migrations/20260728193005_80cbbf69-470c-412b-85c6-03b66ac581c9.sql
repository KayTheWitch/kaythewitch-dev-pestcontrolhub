CREATE OR REPLACE FUNCTION public.get_os_report_by_token(_token uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'os', jsonb_build_object(
      'numero', so.numero,
      'status', so.status,
      'data_prevista', so.data_prevista,
      'checkin_at', so.checkin_at,
      'checkout_at', so.checkout_at,
      'checklist', so.checklist,
      'observacoes_campo', so.observacoes_campo,
      'responsavel', so.responsavel,
      'assinatura', so.assinatura_responsavel
    ),
    'cliente', jsonb_build_object(
      'nome', cl.nome,
      'documento', cl.documento,
      'endereco', cl.endereco,
      'cidade', cl.cidade,
      'estado', cl.estado,
      'telefone', cl.telefone,
      'email', cl.email
    ),
    'produtos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'nome', sop.nome,
        'lote', sop.lote,
        'validade', sop.validade,
        'quantidade_aplicada', sop.quantidade_aplicada,
        'unidade', sop.unidade,
        'principio_ativo', p.principio_ativo,
        'registro_ms', p.registro_ms
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
    ) ELSE NULL END,
    'certificado', (SELECT c.token_publico FROM public.service_certificates c WHERE c.service_order_id = so.id LIMIT 1)
  )
  FROM public.service_orders so
  LEFT JOIN public.clients cl ON cl.id = so.client_id
  LEFT JOIN public.os_technical_responsible otr ON otr.os_id = so.id
  WHERE so.public_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_os_report_by_token(uuid) TO anon, authenticated;