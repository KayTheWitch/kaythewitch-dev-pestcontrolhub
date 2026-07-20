## Fase 6 — Portal do Cliente

Após fechar o ciclo econômico na Fase 5, a próxima etapa do roadmap é o **Portal do Cliente**: uma área autenticada e leve onde o cliente final acompanha seus serviços, documentos e financeiro sem depender de contato com o comercial.

### Escopo funcional

**1. Autenticação dedicada do cliente**
- Novo papel `cliente` no enum `app_role` (RLS separada do time interno).
- Convite por e-mail disparado ao criar/editar cliente (link com magic link Supabase).
- Vínculo `profiles.client_id` para amarrar login → registro de cliente.
- Rota `/portal/auth` isolada do `/auth` interno.

**2. Dashboard do cliente (`/portal`)**
- Resumo: próximas visitas confirmadas, última OS concluída, títulos em aberto.
- Atalhos para propostas pendentes de assinatura e relatórios recentes.

**3. Propostas (`/portal/propostas`)**
- Lista das propostas do cliente logado com status.
- Visualização read-only e botão "Assinar" reaproveitando o fluxo ZapSign já existente.

**4. Ordens de serviço (`/portal/os`)**
- Histórico com status, técnico responsável, data e link para o relatório técnico (`/r/:token`).
- Confirmação/reagendamento de visita futura (reaproveita `/c/:token`).

**5. Financeiro (`/portal/financeiro`)**
- Lista de títulos a receber do cliente (aberto, vencido, pago).
- Download de comprovante simples (HTML imprimível) para títulos quitados.
- Sem baixa direta pelo cliente (fase futura integra PIX/boleto).

**6. Documentos (`/portal/documentos`)**
- Relatórios técnicos concluídos e propostas assinadas, agrupados por OS/proposta.

### Modelo de dados

Reaproveita tabelas existentes. Adições mínimas:

```text
app_role                  -- adicionar valor 'cliente'
profiles                  -- adicionar coluna client_id uuid references clients(id)
client_invitations (
  id, client_id, email, token, status (pendente|aceito|expirado),
  invited_by, expires_at, accepted_at, created_at
)
```

RLS: novas policies em `clients`, `proposals`, `service_orders`, `accounts_receivable`, `financial_payments` para permitir SELECT quando `auth.uid()` pertence a um profile com `client_id` correspondente. Time interno mantém acesso via `has_role`.

### Rotas

```text
/portal/auth                        login/magic link do cliente
/portal                             dashboard
/portal/propostas                   lista
/portal/propostas/:id               detalhe + assinatura
/portal/os                          lista
/portal/os/:id                      detalhe + relatório
/portal/financeiro                  títulos
/portal/documentos                  arquivos
```

Novo layout `src/routes/_portal.tsx` (shell separado do `AppShell` interno, com branding leve e menu próprio). Middleware de rota garante que `client_id` do profile bate com os dados solicitados.

### Arquivos técnicos previstos

- Migração: enum `cliente`, coluna `profiles.client_id`, tabela `client_invitations`, novas policies.
- `src/lib/portal.functions.ts` — server functions para dashboard, listagens e comprovantes (usa `requireSupabaseAuth` + checagem do `client_id`).
- `src/components/PortalShell.tsx` — layout dedicado.
- Rotas `/portal/*` conforme mapa acima.
- Atualização em `src/routes/_authenticated.clientes.$id.tsx` — botão "Convidar para o portal" que cria o invitation e dispara e-mail.
- Atualização em `src/hooks/useAuth.ts` — expor `role` e `clientId` para roteamento condicional.
- README: nova seção Portal do Cliente, rotas, roadmap (marcar Fase 6 e apontar Fase 7 — BI).

### Fora do escopo desta fase

- Pagamento online (PIX/boleto real) — fica para fase financeira 2.
- Chat/tickets de suporte.
- Notificações push/e-mail transacionais além do convite.
- App mobile dedicado (o portal é responsivo web).

Confirma seguir com a Fase 6 nesse escopo?
