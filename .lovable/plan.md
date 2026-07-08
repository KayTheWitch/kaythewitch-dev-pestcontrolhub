
# MVP Ventura — Núcleo Comercial + OS

Sistema interno navegável cobrindo do lead até a geração da Ordem de Serviço, usado pela equipe comercial/atendimento. Integração real com provedor de assinatura eletrônica; demais módulos (campo, estoque, financeiro, BI) ficam preparados na base de dados mas fora do escopo desta entrega.

## Escopo funcional

**1. Captação e pré-cadastro**
- Cadastro de lead com origem (telefone, WhatsApp, site, e-mail, indicação, retorno)
- Cadastro de cliente: PF/PJ, contatos, endereço, unidade, responsável
- Histórico de atendimentos do cliente numa timeline

**2. Diagnóstico comercial/técnico**
- Formulário por tipo de serviço: controle de pragas OU higienização de reservatórios
- Campos: praga/necessidade, área/metragem, volume do reservatório, periodicidade, urgência
- Classificação: residencial, comercial, industrial, condomínio
- Flag "precisa de visita técnica" com agendamento simples

**3. Proposta, contrato e aprovação**
- Geração de proposta a partir do diagnóstico (tabela de preços por tipo + margem configurável)
- Preview em PDF da proposta e da minuta contratual
- Aceite LGPD e envio por e-mail/link
- **Assinatura eletrônica real** via ZapSign (custo baixo, API simples) — webhook devolve status
- Estados: rascunho, enviada, em assinatura, aprovada, recusada, expirada
- Follow-up: fila de propostas pendentes com lembretes

**4. Ordem de Serviço**
- Geração automática da OS ao aprovar a proposta, reaproveitando dados do cliente/diagnóstico
- Data prevista, equipe responsável (cadastro simples), checklist do serviço
- Produtos previstos, equipamentos e EPIs (listas cadastráveis, sem baixa de estoque ainda)
- Instruções técnicas e observações
- OS exportável em PDF; status inicial "aguardando execução" (execução em campo fica para fase 2)

**Módulos de apoio já nesta fase**
- Autenticação e perfis (admin, comercial)
- Dashboard comercial: propostas por status, taxa de conversão, ticket médio, funil
- Cadastros auxiliares: serviços/preços, equipes, produtos, equipamentos, EPIs
- Trilha de auditoria básica (quem criou/alterou o quê)

## Arquitetura

- **Frontend**: TanStack Start (já configurado), shadcn/ui, Tailwind
- **Backend**: Lovable Cloud (Postgres + Auth + Storage + Server Functions)
- **PDF**: geração server-side (proposta, contrato, OS)
- **Assinatura**: ZapSign API — secret `ZAPSIGN_TOKEN`, webhook em `/api/public/zapsign`
- **Storage**: PDFs de propostas, contratos assinados e OS

### Modelo de dados (principais tabelas)

```text
clients (id, tipo PF/PJ, doc, nome, contatos jsonb, enderecos jsonb, ...)
client_units (id, client_id, nome, endereco, responsavel)
leads (id, client_id?, origem, status, notas, created_by)
service_catalog (id, tipo, nome, preco_base, unidade)
diagnostics (id, lead_id, tipo_servico, praga, area_m2, volume_l,
             periodicidade, urgencia, classificacao, precisa_visita)
proposals (id, diagnostic_id, client_id, itens jsonb, subtotal, margem,
           total, status, pdf_url, zapsign_doc_id, signed_at)
contracts (id, proposal_id, pdf_url, signed_pdf_url, lgpd_aceite_at)
service_orders (id, proposal_id, client_id, data_prevista, equipe_id,
                checklist jsonb, produtos jsonb, epis jsonb, obs, status)
teams (id, nome, membros jsonb)
products, equipment, epis (cadastros simples)
audit_log (id, actor_id, entity, entity_id, action, diff jsonb, at)
user_roles (user_id, role)  -- admin | comercial
```

RLS: acesso restrito a usuários autenticados com role `comercial` ou `admin`; `service_role` para webhook ZapSign.

### Rotas principais

```text
/auth
/                         dashboard comercial
/leads                    lista + criação
/clientes                 lista + detalhe (timeline)
/clientes/:id
/diagnosticos/novo
/propostas                lista por status
/propostas/:id            detalhe + envio para assinatura
/os                       lista
/os/:id
/cadastros/servicos
/cadastros/equipes
/cadastros/produtos
/cadastros/epis
```

## Entregas em ondas

1. **Fundação**: Cloud, auth, roles, layout, dashboard vazio, cadastros auxiliares.
2. **Clientes & Leads**: CRUD completo + timeline + origem do lead.
3. **Diagnóstico & Proposta**: formulário, cálculo, PDF, listagem por status.
4. **Assinatura ZapSign**: envio, webhook, status, contrato assinado no storage.
5. **Ordem de Serviço**: geração a partir da proposta aprovada, PDF, listagem.
6. **Dashboard & auditoria**: métricas do funil e log.

## Fora do escopo (fases seguintes)

- App/tela de campo (check-in, fotos, assinatura do cliente na OS)
- Motor de estoque, lotes, validade, compras e fornecedores
- Faturamento, NF-e, boletos, PIX, contas a receber, comissão
- CRM avançado, BI, pesquisa de satisfação, recorrência
- Integrações com WhatsApp e emissor fiscal

## Decisões que ainda podem ajustar o plano

- Provedor de assinatura: sugeri **ZapSign** pelo custo e API. Se preferir Clicksign ou D4Sign, troco o conector.
- Tabela de preços: começo com preço base por serviço + margem manual. Se quiser regras (por m², por volume, por urgência), me diga que já entra no MVP.
