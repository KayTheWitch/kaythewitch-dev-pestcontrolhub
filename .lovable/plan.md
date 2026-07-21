Concluída a Fase 6 (Portal do Cliente), a próxima etapa do roadmap é a **Fase 7 — Business Intelligence (BI)**: transformar os dados operacionais e financeiros já capturados em painéis analíticos para apoiar decisão gerencial.

## Objetivo

Consolidar KPIs de comercial, operação, estoque e financeiro em uma área `/bi` dedicada, com filtros por período, equipe e serviço, além de exportação CSV para análises externas.

## Escopo funcional

**1. Painel Comercial**
- Funil de leads (novo → qualificado → proposta → ganho/perdido) com taxa de conversão por etapa.
- Ticket médio e valor total de propostas aprovadas por período.
- Ranking de origem de leads e motivos de perda.

**2. Painel Operacional**
- OS por status, tempo médio entre criação → execução → conclusão.
- Produtividade por equipe/técnico (OS concluídas, horas em campo via check-in/out).
- Taxa de reagendamento e cancelamento.

**3. Painel Estoque & Compras**
- Giro de produto (consumo mensal x saldo).
- Itens críticos (abaixo do mínimo, vencendo em 30/60/90 dias).
- Lead time médio de fornecedores e valor comprado por fornecedor.

**4. Painel Financeiro**
- DRE simplificado (receita realizada, despesa realizada, resultado) por mês.
- Aging de contas a receber e a pagar (0-30, 31-60, 61-90, 90+).
- Previsto x realizado por categoria financeira.

**5. Filtros globais e exportação**
- Filtros: intervalo de datas, equipe, serviço, categoria financeira.
- Botão "Exportar CSV" em cada painel.

## Modelo de dados

Sem novas tabelas. Criar **views SQL** e **funções agregadoras** (`security definer`) para consolidar métricas com desempenho previsível:

```text
v_bi_lead_funnel
v_bi_os_throughput
v_bi_team_productivity
v_bi_stock_turnover
v_bi_supplier_performance
v_bi_financial_dre
v_bi_receivables_aging
v_bi_payables_aging
```

Todas restritas a `admin` e `comercial` via RLS/`has_role`. Cliente do portal não acessa.

## Rotas

```text
/bi                     índice com atalhos aos painéis
/bi/comercial
/bi/operacional
/bi/estoque
/bi/financeiro
```

Novo item "BI" no `AppShell` (seção "Principal"), visível apenas para `admin` e `comercial`.

## Arquivos técnicos previstos

- Migração: criação das views/funções acima, grants para `authenticated`, checagem de role dentro das funções agregadoras.
- `src/lib/bi.functions.ts` — server functions que consomem as views com filtros validados por Zod.
- `src/components/bi/` — `KpiCard`, `ChartLine`, `ChartBar`, `ChartFunnel`, `DateRangeFilter` (usando `recharts`, já disponível no shadcn stack).
- Rotas `/bi/*` conforme mapa acima.
- Atualização em `src/components/AppShell.tsx` — nova entrada de menu condicional por role.
- README: seção BI + marcar Fase 7 concluída, apontar Fase 8 (Compliance ANVISA).

## Fora do escopo desta fase

- Alertas automatizados (e-mail/WhatsApp) baseados em metas.
- Previsão/forecast estatístico.
- Cubos OLAP ou data warehouse externo — tudo roda em Postgres.
- Exportação PDF dos painéis (CSV apenas).

Confirma seguir com a Fase 7 nesse escopo?