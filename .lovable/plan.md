# Remoção da marca "Ventura" — renomeação para Pest Control Hub

Objetivo: eliminar toda menção à empresa Ventura no app e na documentação, substituindo por nome genérico de controle de pragas.

## Nome adotado

- Nome do produto: **Pest Control Hub**
- Nome curto (PWA/menu): **Pest Control**
- Onde hoje aparece "Ventura Dedetização" (documentos públicos, relatórios, certificados): **Pest Control Hub — Controle de Pragas**

## O que muda na interface

- Menu lateral do sistema (topo) e cabeçalho mobile: "Ventura / Gestão Operacional" → "Pest Control Hub / Gestão Operacional".
- Tela de login e tela de convite: logo/título passam a "Pest Control Hub".
- Portal do cliente (cabeçalho e mensagem de acesso não vinculado): "Ventura" → "Pest Control Hub".
- Relatório técnico público (`/r/$token`): rodapé/emissor passa a "Pest Control Hub — Controle de Pragas"; mensagem de compartilhamento no WhatsApp também.
- Certificado público (`/ces/$token`): emissor passa a "Pest Control Hub — Controle de Pragas" (mantida a referência à RDC 52/2009, que é norma e não marca).
- App instalável (PWA): nome "Pest Control Hub", nome curto "Pest Control", descrição sem menção à empresa.

## O que muda em SEO / títulos de página

Títulos e descrições (head) de: raiz do app, login, BI (índice, comercial, operacional, estoque, financeiro), relatório público e certificado público — todos passam a usar "Pest Control Hub", sem citar a empresa.

## Documentação

`README.md`: título e descrição reescritos como "Pest Control Hub — ERP para controle de pragas", removendo "Ventura" e "Ventura Dedetização"; restante do conteúdo permanece.

## Detalhes técnicos

- Arquivos com ocorrências: `src/routes/__root.tsx`, `src/routes/auth.tsx`, `src/routes/portal.tsx`, `src/routes/invite.$token.tsx`, `src/routes/r.$token.tsx`, `src/routes/ces.$token.tsx`, `src/routes/_authenticated.bi.{index,comercial,operacional,estoque,financeiro}.tsx`, `src/components/AppShell.tsx`, `src/components/PortalShell.tsx`, `src/lib/offline/db.ts`, `vite.config.ts`, `README.md`.
- `src/lib/offline/db.ts`: interface `VenturaDB` → `OfflineDB`. O nome do banco local (`ventura-offline`) e os caches do service worker (`ventura-html`, `ventura-assets`) são identificadores internos: renomeá-los descarta cache offline e fila de sincronização pendente nos aparelhos já em uso. Proposta: renomear (identificadores não são visíveis ao usuário final, mas cumprem o pedido de remover qualquer menção) — a fila pendente deve ser sincronizada antes do deploy.
- Nenhuma alteração de banco de dados, schema ou lógica de negócio.
- Verificação: typecheck e revisão de que nenhuma ocorrência de "ventura" resta no projeto.
