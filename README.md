# Pest Control Hub — ERP para controle de pragas

Sistema interno de gestão para empresas de controle de pragas: do lead ao faturamento, com execução de campo offline e compliance sanitário.

## Stack

- **React 19 + TanStack Start** (roteamento por arquivos em `src/routes/`)
- **Vite 7** e **Tailwind CSS v4** (tokens em `src/styles.css`)
- **shadcn/ui** + lucide-react
- **TanStack Query** para dados
- **Lovable Cloud (Supabase)**: Postgres, Auth, Storage, RLS
- **PWA**: `vite-plugin-pwa` + IndexedDB (`idb`) para modo offline

## Como rodar

```bash
bun install
bun run dev     # http://localhost:8080
```

## Módulos e rotas

### Área autenticada (`_authenticated`)

| Rota | Descrição |
| --- | --- |
| `/` | Painel com KPIs comerciais e operacionais |
| `/leads` | Captação e qualificação de leads |
| `/clientes`, `/clientes/$id` | Cadastro de clientes e unidades |
| `/diagnosticos/novo` | Diagnóstico técnico (área, praga, urgência) |
| `/propostas`, `/propostas/$id` | Propostas com itens, margem e assinatura eletrônica |
| `/os`, `/os/$id` | Ordens de serviço e detalhamento |
| `/os/$id/campo` | Execução em campo (check-in, checklist, produtos, fotos, assinatura) — funciona offline |
| `/agenda` | Programação semanal por equipe, reagendamento e bloqueios |
| `/estoque` | Saldos por lote, validades, alertas de mínimo, entradas e ajustes |
| `/compras` | Pedidos de compra, recebimento com entrada de lote, sugestão de reposição |
| `/fornecedores` | Cadastro de fornecedores |
| `/financeiro`, `/financeiro/receber`, `/financeiro/pagar` | Contas a receber/pagar, baixas e fluxo de caixa |
| `/compliance/*` | RT/ART, documentos regulatórios, certificados, EPIs, embalagens, livro de aplicações |
| `/bi/*` | Painéis comercial, operacional, estoque e financeiro |
| `/sync` | Fila de sincronização offline e cache local |
| `/cadastros/*` | Serviços, equipes, produtos, EPIs, categorias financeiras |

### Portal do cliente (`/portal/*`)

Dashboard, propostas, ordens de serviço, financeiro e documentos, restritos ao cliente vinculado ao perfil.

### Rotas públicas

| Rota | Descrição |
| --- | --- |
| `/auth` | Login |
| `/r/$token` | Relatório técnico da OS (imprimível, compartilhável por WhatsApp/e-mail) |
| `/ces/$token` | Verificação do Certificado de Execução de Serviço |
| `/invite/$token` | Aceite de convite do portal do cliente |

## Modelo de dados (principais tabelas)

- **Comercial**: `leads`, `clients`, `client_units`, `diagnostics`, `proposals`
- **Operação**: `service_orders`, `service_order_products`, `service_order_photos`, `service_order_events`, `teams`, `schedule_blocks`
- **Suprimentos**: `products`, `product_batches`, `stock_movements`, `suppliers`, `product_suppliers`, `purchase_orders`, `purchase_order_items`
- **Financeiro**: `accounts_receivable`, `accounts_payable`, `financial_payments`, `financial_categories`
- **Compliance**: `technical_responsibles`, `os_technical_responsible`, `regulatory_documents`, `service_certificates`, `epis`, `epi_deliveries`, `packaging_returns`
- **Acesso**: `profiles`, `user_roles`, `client_invitations`, `audit_log`

## Automações no banco

- `apply_stock_movement` — atualiza saldo do lote a cada movimentação
- `apply_os_stock_deduction` / `reverse_os_stock_deduction` — baixa e estorno de estoque da OS
- `trg_os_financial_sync` — gera/cancela conta a receber ao concluir/reabrir OS
- `trg_po_financial_sync` + `upsert_payable_from_po` — conta a pagar a partir do recebimento de compras
- `trg_os_issue_ces` + `issue_service_certificate` — emissão do CES
- `trg_os_compliance_snapshot` — congela o RT vigente na conclusão da OS
- `get_os_report_by_token` / `get_certificate_by_token` — leitura pública por link seguro
- Funções `bi_*` — agregações dos painéis, com checagem de papel

## Segurança

- RLS habilitada em todas as tabelas de negócio.
- Papéis em `user_roles` (`admin`, `comercial`, `cliente`) verificados por `has_role` / `has_any_role` (SECURITY DEFINER, sem recursão).
- Cliente do portal enxerga apenas registros do próprio `client_id` (`current_portal_client_id`).
- Conteúdo público é exposto somente por funções de token, nunca por acesso direto às tabelas.

## Offline / PWA

- Instalável (manifest + ícones em `public/`), service worker apenas em produção.
- `src/lib/offline/`: `db.ts` (IndexedDB), `image.ts` (compressão), `net.ts` (conectividade), `sync.ts` (fila com retry e conflitos), `os-offline.ts` (cache de OS).
- Fotos comprimidas (~1600px, JPEG 0,7) antes de gravar no aparelho.
- Fila idempotente: fotos/assinatura → produtos → baixa de estoque → status da OS.

## Roadmap

Entregues: relatórios, agenda, estoque, compras, financeiro, portal do cliente, BI, compliance ANVISA, PWA offline.

Próximas frentes: contratos recorrentes, notificações e e-mails transacionais, auditoria e gates por papel, busca global e refinamento mobile.
