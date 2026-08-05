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

Requisitos: [Bun](https://bun.sh) 1.1+ (ou Node 20+ com npm) e um backend Lovable Cloud provisionado.

```bash
bun install
bun run dev        # http://localhost:8080
```

### Scripts

| Script | O que faz |
| --- | --- |
| `bun run dev` | Servidor de desenvolvimento com HMR na porta 8080 |
| `bun run build` | Build de produção (SSR para runtime edge) |
| `bun run build:dev` | Build em modo development, útil para depurar prerender |
| `bun run preview` | Serve localmente o resultado do build |
| `bun run lint` | ESLint em todo o projeto |
| `bun run format` | Prettier com escrita em disco |

### Variáveis de ambiente

O arquivo `.env` é gerado e mantido automaticamente pelo Lovable Cloud — não edite à mão.

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | Endpoint do backend usado pelo cliente do navegador |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável (segura no bundle, protegida por RLS) |
| `VITE_SUPABASE_PROJECT_ID` | Identificador do projeto backend |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` | Equivalentes para execução no servidor (SSR / server functions) |

Segredos de servidor (chaves de serviço, tokens de integração) ficam no cofre do backend e são lidos apenas dentro de handlers — nunca no escopo de módulo e nunca no cliente.

### Estrutura do projeto

```text
src/
  routes/            rotas por arquivo (_authenticated.*, portal.*, públicas)
  components/        AppShell, PortalShell, UI de domínio
    ui/              primitivos shadcn/ui
    offline/         indicador de conectividade, captura de assinatura
    bi/              filtros e utilitários dos painéis
  hooks/             useAuth, useOfflineStatus, use-mobile
  lib/
    offline/          IndexedDB, compressão de imagem, fila de sync
    pwa/register.ts   registro do service worker
    format.ts         moeda, datas e documentos (pt-BR)
  integrations/supabase/   clientes e tipos gerados (não editar)
  styles.css         tokens de design e tema Tailwind v4
public/              ícones do PWA e assets estáticos
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
- Papéis em `user_roles` (`admin`, `comercial`, `tecnico`, `cliente`) verificados por `has_role` / `has_any_role` (SECURITY DEFINER, sem recursão). Papéis nunca ficam em `profiles` nem nos metadados do usuário.
- Cliente do portal enxerga apenas registros do próprio `client_id` (`current_portal_client_id`).
- Conteúdo público é exposto somente por funções de token, nunca por acesso direto às tabelas.
- Execução das funções internas do banco é revogada de `anon` e concedida seletivamente; apenas `get_os_report_by_token` e `get_certificate_by_token` são públicas.

### Papéis e primeiro acesso

| Papel | Alcance |
| --- | --- |
| `admin` | Acesso total, incluindo cadastros, compliance, BI e concessão de papéis |
| `comercial` | Ciclo comercial, operação, suprimentos e financeiro |
| `tecnico` | Execução de campo das OS atribuídas |
| `cliente` | Somente o portal, restrito ao próprio `client_id` |

1. O **primeiro usuário** criado no sistema recebe `admin` + `comercial` (bootstrap).
2. Qualquer cadastro posterior em `/auth` **não recebe papel algum** e fica sem acesso até um administrador conceder um papel.
3. Clientes entram pelo convite (`/invite/$token`), que vincula `profiles.client_id` e concede apenas `cliente`.

### Storage

| Bucket | Conteúdo |
| --- | --- |
| `os-fotos` | Fotos de execução das OS (privado, acesso por URL assinada) |
| `compliance-docs` | ART, alvarás e documentos regulatórios (privado) |

## Offline / PWA

- Instalável (manifest + ícones em `public/`), service worker apenas em produção.
- `src/lib/offline/`: `db.ts` (IndexedDB), `image.ts` (compressão), `net.ts` (conectividade), `sync.ts` (fila com retry e conflitos), `os-offline.ts` (cache de OS).
- Fotos comprimidas (~1600px, JPEG 0,7) antes de gravar no aparelho.
- Fila idempotente: fotos/assinatura → produtos → baixa de estoque → status da OS.

### Fluxo de campo sem sinal

1. Em `/os`, use **preparar para offline** (OS individual ou o roteiro do dia) enquanto há rede.
2. Execute em `/os/$id/campo`: check-in geolocalizado, checklist, produtos por lote, fotos e assinatura ficam no aparelho.
3. Ao voltar a rede, a fila sincroniza automaticamente; acompanhe, reprocesse ou descarte itens em `/sync`.

## Convenções de desenvolvimento

- Cores, sombras e gradientes sempre por tokens semânticos de `src/styles.css` — sem `text-white`, `bg-black` ou hex direto nos componentes.
- Rotas novas são arquivos em `src/routes/`; `src/routeTree.gen.ts` é gerado e não deve ser editado.
- Mudanças de schema sempre por migração; dados por operações de insert/update, nunca por migração.
- Arquivos em `src/integrations/supabase/` são gerados automaticamente.
- Cada rota de conteúdo define seu próprio `head()` com título e descrição únicos.

## Deploy

Publicação pela própria plataforma Lovable (build SSR para runtime edge). URLs estáveis:

- Produção: `project--<id>.lovable.app`
- Preview: `project--<id>-dev.lovable.app`

Rotas destinadas a chamadas externas (webhooks, cron) devem ficar sob `src/routes/api/public/*` e validar o chamador no próprio handler.

## Roadmap

Entregues: relatórios, agenda, estoque, compras, financeiro, portal do cliente, BI, compliance ANVISA, PWA offline.

Próximas frentes: contratos recorrentes, notificações e e-mails transacionais, auditoria e gates por papel, busca global e refinamento mobile.

## Licença

Software proprietário de uso interno. Todos os direitos reservados.

