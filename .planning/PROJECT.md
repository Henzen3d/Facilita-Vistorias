# Facilita Vistorias App

## What This Is

Plataforma interna de vistorias imobiliárias da Facilita Vistorias (Blumenau/SC). Permite que vistoriadores realizem vistorias completas pelo celular em campo — capturando foto + áudio por item/ambiente, mesmo offline — e que o sistema gere automaticamente um relatório fotográfico compartilhável. Voltada para vistoriadores de campo, gestores/admin e clientes (locatários/locadores).

## Core Value

Um vistoriador consegue executar uma vistoria completa no celular, sem sinal, e obter um relatório fotográfico pronto para envio — com descrições técnicas geradas automaticamente a partir de foto + narração em áudio.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Schema de dados completo (Prisma) com 13 modelos — Phase 1
- ✓ Autenticação NextAuth com roles admin/vistoriador — Phase 1
- ✓ APIs CRUD (imóveis, pessoas, agendamentos) e estrutura de 22 telas — Phase 1
- ✓ PWA offline-first: IndexedDB, captura de foto/áudio, fila de sync em background — Phase 2

### Active

<!-- Current scope. Building toward these. -->

- [ ] Pipeline de IA: transcrição do áudio + descrição técnica consolidada por item
- [ ] Tela de revisão/edição do relatório antes de finalizar
- [ ] Geração de PDF + link público com token + QR code
- [ ] Envio manual do link por WhatsApp (deep link wa.me)
- [ ] Contestação de item pelo cliente (via link público)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Termos regulados ("laudo", "laudo técnico") — empresa sem registro no CREA; usar sempre "relatório fotográfico" / "documentação técnica"
- Comparação automática entrada x saída — Phase 5+ (contestação)
- Assinatura digital (DocuSign/Fast4Sign) — backlog
- Timeline com geolocalização — backlog
- App multi-imobiliária (white-label multi-tenant) — backlog

## Context

- **Stack:** Next.js 15 (App Router), TypeScript, Prisma + PostgreSQL, NextAuth, Tailwind, PWA via next-pwa + IndexedDB (`idb`).
- **Design System:** identidade Facilita (azul-céu `#00AEEF`), referências Lovable em `Referencias/Design/Lovable/`.
- **Diferencial de mercado:** nenhum concorrente gera a descrição do item a partir de foto + narração em áudio via IA.
- **Estado atual:** núcleo de dados, auth e app de campo offline-first já implementados (Phases 1–2). Falta o pipeline de IA, geração do relatório e fluxo de envio/contestação.

## Constraints

- **Offline-first**: perda de conexão em campo não pode causar perda de dados.
- **Mobile-first**: uso real é 100% em celular durante a vistoria.
- **LGPD**: dados de CPF, fotos de imóveis de terceiros e assinaturas exigem política de retenção e controle de acesso.
- **Custo controlado**: camadas gratuitas de IA como padrão, com fallback pago configurável (filosofia NexusLocal).
- **Regulatório**: nenhum texto/PDF/UI pode usar termos regulados pelo CREA.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA + IndexedDB para offline-first | Uso 100% em campo com internet instável | ✓ Good |
| `<input capture>` + MediaRecorder para mídia | Compatibilidade mobile ampla | ✓ Good |
| next-pwa para service worker | Já instalado, integração nativa com Next | ✓ Good |
| Modelos IA em camada gratuita com fallback pago | Controle de custo | — Pending |

---
*Last updated: 2026-07-15 after GSD state reconciliation*
