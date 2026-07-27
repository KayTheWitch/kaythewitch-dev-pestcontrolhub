
# Fase 9 — App instalável (PWA) com modo offline em campo

Objetivo: o técnico executa a OS inteira sem internet (subsolo, zona rural, indústria) e o sistema sincroniza sozinho ao voltar o sinal, sem perder dados nem duplicar registros.

Como a rota `/agenda` não existe no código atual, a preparação offline sai da lista de Ordens de Serviço (`/os`).

## 1. Instalação como app

- Manifest com nome "Ventura", ícones (192/512 + maskable), cor de tema alinhada ao design atual e `display: standalone`.
- Ícones gerados e servidos em `public/`; tags de manifest, theme-color e apple-touch-icon no root.
- Service worker gerado por `vite-plugin-pwa` (`generateSW`, `registerType: autoUpdate`), registrado apenas em produção por um módulo com guardas — nunca no preview do editor nem em iframe, com kill-switch `?sw=off`.
- Navegações HTML em `network-first`; assets estáticos com hash em `cache-first`.

Observação: o modo offline só funciona no app publicado, não dentro do preview do editor.

## 2. Preparar OS do dia para offline

- Na lista `/os`, botão "Preparar para offline" (OS do dia / próximos dias do técnico) e um marcador por OS já disponível offline.
- O sistema baixa e guarda no aparelho: dados do cliente e endereço, checklist, produtos previstos, lotes disponíveis com validade, RT vigente e informações regulatórias necessárias à conclusão.
- Indicador na tela da OS quando o conteúdo veio do cache local.

## 3. Execução offline da OS

Todas as etapas já existentes passam a funcionar sem rede:

- Check-in e check-out com geolocalização (GPS funciona offline).
- Checklist técnico.
- Produtos aplicados, com seleção de lote a partir do cache.
- Fotos: capturadas, **comprimidas automaticamente** (redimensionamento para lado máximo ~1600px e JPEG ~0,7) antes de gravar no aparelho, evitando estourar a cota do navegador. Aviso na tela se o armazenamento local ficar próximo do limite.
- Assinatura do cliente no canvas.
- Conclusão local marca a OS como "pendente de sincronização" — o certificado (CES) e a baixa de estoque só ocorrem no servidor, na sincronização.

## 4. Fila de sincronização

- Ao detectar rede, a fila é processada em ordem: fotos e assinatura → baixa de estoque → atualização de status da OS (o que dispara CES, financeiro e demais automações já existentes).
- Cada item da fila carrega uma chave de idempotência para não duplicar registros em caso de reenvio.
- Repetição automática com espera crescente para falhas de rede.
- Erros de regra de negócio (ex.: lote esgotado por outro técnico) param aquele item e pedem intervenção manual.

## 5. Tela `/sync` e indicadores

- Lista de pendências com status, tentativas e último erro; log das sincronizações concluídas.
- Tela de resolução de conflito: trocar o lote indisponível mantendo o resto da execução registrada.
- No cabeçalho: ícone de conectividade (online / offline / sincronizando), contador "N pendentes", horário da última sincronização e aviso destacado se houver registro local com mais de 24h sem enviar.

## Detalhes técnicos

- `vite-plugin-pwa` (`devOptions.enabled: false`, `injectRegister: null`) + wrapper único de registro com as guardas de preview/iframe/dev e `?sw=off`.
- `idb` para stores tipadas: `os_cache`, `sync_queue`, `photo_blobs`, `meta`.
- Nova camada `src/lib/offline/`: `db.ts` (schema), `sync.ts` (enfileirar/processar/retry), `net.ts` (detecção de rede: `navigator.onLine` + heartbeat leve), `os-offline.ts` (mesma assinatura das chamadas online, decidindo local x remoto).
- Compressão de imagem via `canvas` no cliente, antes da gravação em IndexedDB.
- Sem alterações de schema no banco; a sincronização reutiliza as RPCs existentes (`apply_os_stock_deduction`, triggers de CES e financeiro).
- Ajustes de UI em: lista `/os`, detalhe `/os/$id`, `AppShell` (indicador), nova rota `/sync`.

## Fora do escopo

- Offline para módulos administrativos (financeiro, BI, compras) — apenas execução de OS em campo.
- Notificações push.
- Sincronização entre técnicos sem servidor.

## Entrega final

- Configuração PWA + camada offline + tela `/sync`.
- Atualização do `README.md` no mesmo padrão de detalhe, marcando a Fase 9 como concluída.
