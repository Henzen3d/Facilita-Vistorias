# Roadmap: Facilita Vistorias App

## Overview

Do núcleo de dados ao relatório compartilhável: construir primeiro a fundação (dados + auth), depois o app de campo offline-first, e por fim o pipeline de IA, a geração do relatório fotográfico e o fluxo de envio/contestação para o cliente.

## Milestone v1.0 — MVP

**Milestone Goal:** Vistoriador executa vistoria completa no celular offline e o cliente recebe um relatório fotográfico com descrições geradas por IA, compartilhável por WhatsApp.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Núcleo de Dados e Auth** - Schema Prisma, NextAuth, APIs CRUD, painel admin
- [x] **Phase 2: App de Campo (PWA) e Núcleo Offline** - PWA offline-first, IndexedDB, captura foto/áudio, sync em background
- [ ] **Phase 3: Relatório, PDF e Pipeline de IA** - Transcrição + descrição por IA, revisão, geração de PDF com link público
- [ ] **Phase 4: Envio e Contestação** - Envio por WhatsApp, link público com token, contestação pelo cliente

## Phase Details

### Phase 1: Núcleo de Dados e Auth
**Goal**: Estabelecer a fundação do sistema com modelo de dados completo, autenticação por roles, APIs CRUD e painel administrativo.
**Depends on**: Nothing (first phase)
**Success Criteria** (what must be TRUE):
  1. Login de admin acessa o painel admin; vistoriador não acessa
  2. APIs CRUD de imóveis, pessoas e agendamentos respondem com dados reais do Prisma
  3. Dashboard mostra métricas reais do banco
**Plans**: 1/1 plans complete

Plans:
- [x] 01-01: Schema Prisma + NextAuth + APIs CRUD + painel admin

### Phase 2: App de Campo (PWA) e Núcleo Offline
**Goal**: Transformar as telas placeholder em um PWA funcional que executa vistorias 100% offline com captura de foto/áudio e sincronização automática em background.
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. Vistoriador consegue abrir as vistorias do dia offline (IndexedDB pré-carregado)
  2. Fotos e áudios são capturados por item e salvos localmente
  3. Itens sincronizam automaticamente quando a conexão retorna, com indicadores visuais de status
**Plans**: 1/1 plans complete

Plans:
- [x] 02-01: PWA (next-pwa) + IndexedDB + captura foto/áudio + sync engine

### Phase 3: Relatório, PDF e Pipeline de IA
**Goal**: Gerar descrições técnicas automáticas (foto + áudio) via IA e produzir o relatório fotográfico em PDF com versão digital pública.
**Depends on**: Phase 2
**Success Criteria** (what must be TRUE):
  1. Áudio de cada item é transcrito e a IA gera uma descrição técnica editável combinando foto + fala
  2. Admin/vistoriador revisa e edita todas as descrições antes de finalizar
  3. Sistema gera PDF do relatório + link público com token e QR code
**Plans**: TBD

Plans:
- [ ] 03-01: TBD (definir em /gsd:discuss-phase 3)

### Phase 4: Envio e Contestação
**Goal**: Permitir o envio do relatório ao cliente e a contestação de itens específicos dentro de um prazo.
**Depends on**: Phase 3
**Success Criteria** (what must be TRUE):
  1. Link do relatório é enviado por WhatsApp (deep link wa.me)
  2. Cliente acessa a versão digital por token e visualiza fotos/descrições
  3. Cliente pode contestar itens específicos dentro do prazo configurado
**Plans**: TBD

Plans:
- [ ] 04-01: TBD (definir em /gsd:discuss-phase 4)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Núcleo de Dados e Auth | 1/1 | Complete | 2026-07-14 |
| 2. App de Campo (PWA) | 1/1 | Complete | 2026-07-15 |
| 3. Relatório, PDF e IA | 0/0 | Not started | - |
| 4. Envio e Contestação | 0/0 | Not started | - |
