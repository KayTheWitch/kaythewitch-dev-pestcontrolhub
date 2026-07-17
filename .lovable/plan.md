
# Fase 5 — Financeiro

Fechar o ciclo econômico do MVP: toda OS concluída vira **conta a receber**, todo Pedido de Compra recebido vira **conta a pagar**. Lançamentos manuais também são suportados (despesas fixas, taxas, reembolsos). O módulo entrega baixa de pagamento, conciliação simples, fluxo de caixa e KPIs financeiros — sem emissão fiscal e sem integração bancária (fica para fase futura).

## Escopo funcional

**1. Plano de contas simplificado**
- Categorias financeiras (`receita_servico`, `despesa_produto`, `despesa_operacional`, `imposto`, `outros`) configuráveis em cadastros.
- Cada lançamento pertence a uma categoria — base para relatórios por DRE gerencial.

**2. Contas a receber**
- Geração automática ao concluir uma OS (1 título por OS, valor = total da proposta vinculada).
- Vencimento padrão: `data_conclusao + prazo_cliente` (config global, default 15 dias); editável por título.
- Status: `aberto`, `parcialmente_pago`, `pago`, `vencido`, `cancelado`.
- Baixa (total ou parcial) registrando forma de pagamento (`pix`, `boleto`, `dinheiro`, `cartao`, `transferencia`) e data.

**3. Contas a pagar**
- Geração automática quando um PC muda para `recebido` ou `recebido_parcial` (título = subtotal recebido; recebimentos parciais criam títulos incrementais idempotentes por `purchase_order_id + item recebido`).
- Lançamento manual para despesas fixas (aluguel, salário, combustível).
- Mesmo fluxo de status e baixa do contas a receber.

**4. Fluxo de caixa e KPIs**
- Dashboard `/financeiro` com:
  - KPIs: a receber (aberto + vencido), a pagar (aberto + vencido), saldo previsto 30 dias, ticket médio recebido.
  - Gráfico de fluxo de caixa realizado × previsto (mês corrente + 2 meses à frente).
  - Alertas de títulos vencidos e a vencer nos próximos 7 dias.
- Filtros por período, categoria, status e cliente/fornecedor.

**5. Integração com módulos existentes**
- **OS**: ao concluir, chama `create_receivable_from_os` (idempotente por `service_order_id`). Reabertura da OS cancela o título se ainda estiver `aberto` (se já houver baixa, exige estorno manual).
- **Compras**: `receive_purchase_order_item` passa a acionar `upsert_payable_from_po` no final da transação.
- **Cliente/Fornecedor**: nova aba "Financeiro" em cada detalhe listando títulos, total em aberto e histórico de baixas.

## Modelo de dados

```text
financial_categories (id, tipo, nome, ativo)              -- seed inicial via migration

accounts_receivable (
  id, numero, client_id, service_order_id?, proposal_id?,
  categoria_id, descricao, valor_original, valor_pago,
  data_emissao, data_vencimento, data_pagamento?,
  forma_pagamento?, status, observacoes,
  created_by, created_at, updated_at
)

accounts_payable (
  id, numero, supplier_id?, purchase_order_id?,
  categoria_id, descricao, valor_original, valor_pago,
  data_emissao, data_vencimento, data_pagamento?,
  forma_pagamento?, status, observacoes,
  created_by, created_at, updated_at
)

financial_payments (
  id, tipo (receber|pagar), account_id, valor, data_pagamento,
  forma_pagamento, observacoes, user_id, created_at
)
```

Índices em `status`, `data_vencimento`, `client_id`, `supplier_id`. RLS: `admin` full, `comercial` read+write, `tecnico` sem acesso.

## Funções e triggers

- `create_receivable_from_os(_os_id uuid)` — idempotente; chamada dentro do checkout da OS.
- `upsert_payable_from_po(_po_id uuid)` — chamada no fim de `receive_purchase_order_item`.
- `register_financial_payment(...)` — insere em `financial_payments`, atualiza `valor_pago`, recalcula status.
- Trigger diária (job simples via server function agendável) marca `vencido` quando `data_vencimento < now()` e status = `aberto`.

## Rotas

```text
/financeiro                          dashboard + KPIs
/financeiro/receber                  lista de contas a receber (filtros + baixa)
/financeiro/receber/:id              detalhe + histórico de pagamentos
/financeiro/pagar                    lista de contas a pagar (filtros + baixa)
/financeiro/pagar/:id                detalhe + histórico de pagamentos
/financeiro/lancamento/novo          criação manual (a pagar ou a receber)
/cadastros/categorias-financeiras    manutenção do plano de contas
```

Novo grupo "Financeiro" no `AppShell` (após "Suprimentos").

## Arquivos técnicos previstos

- `src/lib/finance.functions.ts` — listagens, criação manual, baixa, KPIs, fluxo de caixa.
- `src/routes/_authenticated.financeiro.index.tsx` — dashboard.
- `src/routes/_authenticated.financeiro.receber.tsx` / `.pagar.tsx` — listagens.
- `src/routes/_authenticated.financeiro.receber.$id.tsx` / `.pagar.$id.tsx` — detalhes.
- `src/routes/_authenticated.financeiro.lancamento.novo.tsx` — form de lançamento manual.
- `src/routes/_authenticated.cadastros.categorias-financeiras.tsx`.
- Componente `PaymentDialog` reaproveitado nas duas listagens.
- Atualização em `os.$id.tsx` (checkout aciona receivable) e `purchases.functions.ts` (receive aciona payable).
- Atualização em `src/lib/format.ts` (labels de status financeiro, formas de pagamento) e `AppShell.tsx`.

## Entrega

1. Migração: tabelas, seed de categorias, funções, RLS, GRANTs.
2. Server functions `finance.functions.ts`.
3. Cadastro de categorias financeiras.
4. Listagens + baixa (receber e pagar).
5. Lançamento manual.
6. Dashboard financeiro.
7. Integração com OS (checkout) e Compras (recebimento).
8. Aba "Financeiro" em cliente e fornecedor.

## README

Atualizar `README.md` mantendo a estrutura atual (visão geral, stack, ER, rotas, roadmap):
- Nova seção **Módulo Financeiro** com escopo, modelo de dados e regras de integração.
- Atualizar o diagrama ER com as 4 novas tabelas e relacionamentos.
- Adicionar as novas rotas no mapa de rotas.
- Marcar Fase 5 como concluída no roadmap; próxima passa a ser Portal do Cliente.
- Atualizar contagem de tabelas (~22) e de rotas.

## Fora do escopo desta fase

- Emissão de NF-e / boleto / PIX real.
- Conciliação bancária automática via Open Finance.
- Comissionamento de vendedor/técnico.
- Regime de competência × caixa (usaremos apenas caixa).
- Multi-conta bancária (assumimos caixa único).

Confirma seguir com esse escopo?
