
# Etapas restantes do roadmap Ventura

Concluídas as Fases 1–7, restam duas fases no plano original. Abaixo, o detalhamento completo de escopo, dados, telas e entregáveis de cada uma, para você decidir se seguimos na ordem, invertemos, ou recortamos.

---

## Fase 8 — Compliance e Documentação Sanitária (ANVISA)

### Objetivo
Transformar o ERP em fonte oficial da documentação exigida pela vigilância sanitária (RDC 52/2009 e normas estaduais), eliminando planilhas paralelas e garantindo rastreabilidade produto → lote → OS → cliente.

### Escopo funcional

**1. Cadastro regulatório de produtos (defensivos)**
- Campos obrigatórios: nº registro MS/ANVISA, classe toxicológica, grupo químico, princípio ativo, antídoto, telefone CIT.
- Upload de FISPQ e bula (PDF) em storage privado, versionadas.
- Validação: produto sem registro MS não pode ser aplicado em OS.

**2. Cadastro de responsável técnico (RT)**
- Nome, CREA/CRQ/CRBio, ART vigente (PDF), data de validade.
- Alerta 60/30 dias antes do vencimento da ART.
- Toda OS concluída referencia o RT vigente na data de execução.

**3. Certificado de Execução de Serviço (CES)**
- Documento oficial exigido pela vigilância, gerado automaticamente ao concluir a OS.
- Conteúdo: dados do cliente, endereço tratado, praga-alvo, produtos aplicados (nome comercial + princípio ativo + lote + concentração + quantidade), garantia, RT + ART, orientações pós-serviço, telefone CIT.
- Layout HTML imprimível (mesmo padrão da Fase 1), numeração sequencial anual, QR Code para verificação pública em `/ces/:token`.

**4. Livro de registro de aplicações**
- Relatório consolidado (mensal/anual) exigido em fiscalização: data, cliente, endereço, produtos, lote, RT, nº CES.
- Exportação CSV e HTML imprimível.

**5. Controle de EPIs por técnico**
- Vincular EPIs entregues a cada técnico com data de entrega, CA, validade.
- Ficha de entrega assinada (PDF gerado + upload da via assinada).

**6. Destinação de embalagens**
- Registro de devolução de embalagens vazias ao fornecedor/central (data, quantidade, comprovante).

### Modelo de dados
Novas tabelas:
```text
regulatory_documents      (product_id, tipo [MS|FISPQ|bula], numero, validade, arquivo)
technical_responsibles    (user_id, conselho, registro, art_numero, art_validade, art_pdf)
os_technical_responsible  (os_id, rt_id) — snapshot histórico
service_certificates      (os_id, numero_ces, token_publico, emitido_em)
epi_deliveries            (user_id, epi_id, ca, quantidade, entregue_em, validade, ficha_pdf)
packaging_returns         (product_id, quantidade, devolvido_em, comprovante, fornecedor_id)
```
Campos adicionados a `products`: `registro_ms`, `classe_toxicologica`, `grupo_quimico`, `principio_ativo`, `antidoto`.

### Rotas
```text
/compliance                       índice
/compliance/rt                    responsáveis técnicos + ARTs
/compliance/certificados          lista de CES emitidos
/compliance/livro-aplicacoes      relatório fiscalizável
/compliance/epis                  entregas por técnico
/compliance/embalagens            destinação de embalagens
/ces/:token                       rota pública (verificação por QR)
```

### Impacto em telas existentes
- Cadastro de produto: aba "Regulatório" (registro MS, FISPQ, bula, classe).
- Conclusão de OS: bloqueia se produto sem registro MS válido ou RT sem ART vigente; ao concluir, gera CES automaticamente.
- Detalhe da OS: botão "Baixar CES" + link wa.me/e-mail (reutiliza infra da Fase 1).

### Entregáveis
- Migração com novas tabelas + RLS + grants.
- 6 rotas novas + rota pública `/ces/:token`.
- Componente `CesDocument` (HTML imprimível com QR).
- Atualização do fluxo de conclusão de OS.
- README: seção Compliance + marcar Fase 8 concluída.

### Fora do escopo
- Integração com sistemas estaduais de vigilância (envio automático).
- Assinatura digital ICP-Brasil do CES (fica com assinatura visual + QR de verificação).

---

## Fase 9 — App PWA com Modo Offline (campo)

### Objetivo
Permitir que o técnico execute a OS completa em locais sem internet (subsolos, zonas rurais, indústrias com sinal fraco) e sincronize ao voltar à cobertura, sem perder dados nem duplicar registros.

### Escopo funcional

**1. Instalação como app (PWA)**
- Manifest + ícones + splash para instalação no Android/iOS.
- Service worker com estratégia:
  - `network-first` para dados dinâmicos.
  - `cache-first` para assets estáticos (JS/CSS/fontes/ícones).
  - `stale-while-revalidate` para listagens já visitadas.

**2. Cache seletivo das OS do dia**
- Ao abrir `/agenda` conectado, técnico marca "Preparar para offline" nas OS do dia.
- Sistema baixa e persiste em IndexedDB: dados do cliente, endereço, checklist do serviço, produtos vinculados + lotes disponíveis, fotos de referência anteriores.

**3. Execução offline da OS**
- Check-in/out (com geolocalização nativa, sem depender de rede).
- Checklist técnico.
- Registro de produtos aplicados (seleção de lote a partir do cache).
- Fotos: capturadas e armazenadas em IndexedDB como blobs.
- Assinatura do cliente no canvas (base64 em IndexedDB).
- Conclusão local marca OS como `pendente_sync`.

**4. Fila de sincronização**
- Ao detectar rede, worker de sync processa a fila em ordem:
  1. Upload de fotos e assinatura para storage.
  2. Aplicação de baixa de estoque via RPC.
  3. Atualização de status da OS.
- UI mostra badge "N pendentes" e log detalhado (`/sync`).
- Retry exponencial em falhas de rede; erros de negócio (ex: lote esgotado por outro técnico) exigem intervenção manual com tela de resolução.

**5. Resolução de conflitos**
- Estratégia: OS pertence a um único técnico no dia; conflito real só ocorre em estoque.
- Se lote reservado offline ficou indisponível, tela de conflito permite trocar lote mantendo o resto da execução.

**6. Indicadores de estado**
- Ícone de conectividade no header (online/offline/sincronizando).
- Timestamp da última sync bem-sucedida.
- Aviso destacado quando há registros locais não sincronizados há mais de 24h.

### Arquitetura técnica
- `vite-plugin-pwa` para service worker + manifest.
- `idb` (wrapper de IndexedDB) para stores tipadas: `os_cache`, `sync_queue`, `photo_blobs`.
- Camada `src/lib/offline/`:
  - `db.ts` — schema IndexedDB.
  - `sync.ts` — enfileirar, processar, retry.
  - `os-offline.functions.ts` — mesma assinatura das server functions online, decidindo local x remoto.
- Detecção de rede: `navigator.onLine` + heartbeat contra um endpoint leve.

### Rotas / telas
```text
/sync                fila de sincronização (log + resolução de conflitos)
/agenda              ganha botão "Preparar OS do dia para offline"
/os/:id              indicador "modo offline" quando servido do cache
```

### Entregáveis
- Configuração PWA (manifest, ícones, service worker).
- Camada offline (IndexedDB + sync).
- Adaptação das telas de execução de OS para operar via camada offline.
- Tela `/sync` com resolução de conflitos.
- README: seção Offline/PWA + marcar Fase 9 concluída.

### Fora do escopo
- Modo offline para módulos administrativos (financeiro, BI, compras) — apenas execução de OS em campo.
- Push notifications (fica para uma fase pós-roadmap).
- Sincronização peer-to-peer entre técnicos sem servidor.

---

## Como você quer seguir?

Três caminhos possíveis:

1. **Ordem original**: Fase 8 (Compliance) → Fase 9 (Offline). Fecha o produto para operar dentro da lei antes de investir em UX de campo.
2. **Inverter**: Fase 9 antes da 8. Ganho imediato para os técnicos em campo, mas mantém o risco regulatório em aberto.
3. **Recortar**: pegar só os itens críticos de cada fase (ex: CES + PWA básico) e adiar o resto.

Me diga qual caminho prefere — ou se quer ajustar escopo de alguma fase — que eu volto com o plano executável.
