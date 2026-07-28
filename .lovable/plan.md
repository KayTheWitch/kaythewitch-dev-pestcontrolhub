
# Plano de melhorias e upgrades — Ventura

Antes de novas funcionalidades, uma verificação do código atual mostrou lacunas concretas em relação ao que o roadmap dava como entregue. Isso define a prioridade.

## Verificado no código (estado real)

- Rotas existentes: leads, clientes, propostas, OS (+ execução em campo), BI, compliance, financeiro, cadastros, portal do cliente, sync, CES público, convite.
- **Não existem** rotas de: agenda/roteirização (`/agenda`), estoque (`/estoque`), compras (`/compras`), fornecedores (`/fornecedores`) e relatório público da OS (`/r/:token`) — apesar de o banco já ter as tabelas de estoque, compras e fornecedores.
- **Não existe** `README.md` no projeto.
- O menu lateral não tem entradas para estoque, compras, fornecedores nem agenda.

## Frente 1 — Fechar lacunas (prioridade máxima)

Reaproveita banco já pronto; é onde o sistema hoje tem dado sem tela.

- `/estoque`: saldos por produto/lote, validades, alertas de mínimo, entradas e ajustes, histórico de movimentações.
- `/fornecedores` e `/compras`: cadastro, pedidos de compra, recebimento com entrada de lote (RPC `receive_purchase_order_item` já existe).
- `/agenda`: visão semanal por equipe, arrastar OS entre dias, bloqueios de agenda; base para o "preparar offline do dia".
- `/r/:token`: relatório técnico público imprimível da OS + compartilhamento por WhatsApp/e-mail.
- Reorganização do menu em seções coerentes (Operação, Suprimentos, Financeiro, Gestão).
- `README.md` completo no padrão GitHub.

## Frente 2 — Contratos recorrentes e renovação

Hoje o ciclo termina na OS avulsa.

- Tabela de contratos (cliente, serviços, periodicidade, vigência, valor mensal, reajuste).
- Geração automática de OS recorrentes a partir do contrato.
- Painel de vencimentos e renovações; faturamento recorrente ligado ao contas a receber.

## Frente 3 — Comunicação e automações

- Templates de e-mail transacional (proposta enviada, OS agendada, CES emitido, título vencendo).
- Lembretes automáticos de visita para o cliente (D-1) e alertas internos por vencimento de ART, validade de lote e estoque mínimo.
- Central de notificações no app com contador de pendências por papel.

## Frente 4 — Qualidade, segurança e desempenho

- Revisar RLS de todas as tabelas com varredura de segurança e corrigir achados.
- Papel `tecnico` hoje existe no código mas quase não restringe telas: aplicar gate por papel em rotas e ações sensíveis (financeiro, compras, cadastros).
- Trilha de auditoria (quem mudou status, valor, lote) e log de acesso a documentos regulatórios.
- Paginação e busca server-side nas listagens grandes (OS, títulos, movimentações).
- Testes automatizados dos fluxos críticos: conclusão de OS, baixa de estoque, sincronização offline.

## Frente 5 — Experiência e produtividade

- Busca global (Cmd+K) por cliente, OS, proposta e título.
- Painel inicial configurável por papel, com filtros salvos.
- Layout mobile refinado para o técnico (telas de campo em uma coluna, botões grandes).
- Exportações padronizadas (CSV/PDF) em todas as listagens.
- Modo escuro e revisão de acessibilidade (contraste, foco, leitores de tela).

## Detalhes técnicos

- Novas tabelas previstas: `contracts`, `contract_items`, `contract_occurrences`, `notifications`, `audit_log` — todas com GRANTs explícitos e RLS por papel.
- Geração de OS recorrentes via função no banco acionada por endpoint público de cron (`/api/public/*`) com verificação de segredo.
- E-mails por função de servidor, sem expor chaves no cliente.
- Agenda reutiliza Leaflet apenas no cliente, carregado após hidratação.
- Nenhuma alteração nas camadas offline já entregues; a agenda passa a ser origem alternativa do "preparar para offline".

## Sequência sugerida

1. Frente 1 (lacunas + README)
2. Frente 4 (segurança e papéis)
3. Frente 2 (contratos)
4. Frente 3 (notificações)
5. Frente 5 (UX)
