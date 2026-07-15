---
phase: 03-relat-rio-pdf-e-pipeline-de-ia
plan: 04
subsystem: review
tags: [review-api, admin-ui, field-ui, crea-guardrails, descricao-final, human-in-loop]

# Dependency graph
requires:
  - phase: 03-relat-rio-pdf-e-pipeline-de-ia
    provides: Item descricaoFinal/estadoConservacao/status REVISADO schema (03-01)
  - phase: 03-relat-rio-pdf-e-pipeline-de-ia
    provides: AI pipeline filling descricao + AnaliseIa + field EM_REVISAO (03-03)
provides:
  - GET /api/vistorias/[id]/revisao full review payload with progress
  - PATCH /api/vistorias/[id]/itens/[itemId]/descricao → REVISADO + CREA ban
  - Shared ItemDescricaoEditor for admin + field
  - Admin detail page data-driven review UI
  - Field revisao-ia mobile page + links from resumo/sucesso
affects:
  - 03-05 PDF finalize gate (all items REVISADO)
  - Phase 4 WhatsApp / contestação (out of scope)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Review authz: ADMIN same empresaId OR VISTORIADOR assigned usuarioId"
    - "descricaoEditada = text diff vs item.descricao baseline; approve equal → false"
    - "UI labels: relatório fotográfico / descrição técnica — never laudo/perícia"
    - "Field AI review online-only (no IndexedDB AI outputs)"

key-files:
  created:
    - src/app/api/vistorias/[id]/revisao/route.ts
    - src/app/api/vistorias/[id]/itens/[itemId]/descricao/route.ts
    - src/components/report/ItemDescricaoEditor.tsx
    - src/app/field/vistorias/[id]/revisao-ia/page.tsx
  modified:
    - src/app/admin/vistorias/[id]/page.tsx
    - src/app/field/vistorias/[id]/resumo/page.tsx
    - src/app/field/vistorias/[id]/sucesso/page.tsx
    - src/lib/auth.ts

key-decisions:
  - "session.user.id set from JWT sub so vistoriador authz works on review APIs"
  - "Midias include transcricao in GET revisao for D-03 audio display"
  - "Plan 04 does not call finalize/PDF — banner only when all REVISADO"
  - "Field finalize contract preserved: UPDATE_VISTORIA_STATUS → EM_REVISAO"

patterns-established:
  - "Shared client editor component for admin desktop + field PhoneShell"
  - "REGULATED_TERM 400 code for human-edited text (guardrails.containsRegulatedTerms)"
  - "Progress counters: total / analisados / revisados / pendentes from item statuses"

requirements-completed: [SC-02, REV-01]

# Metrics
duration: ~4min
completed: 2026-07-15
---

# Phase 3 Plan 04: Human Review Gate Summary

**Admin and field can inspect AI descriptions, edit/approve one-by-one to REVISADO, with CREA term rejection and checklist-safe field finalize preserved**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-15T22:03:21Z
- **Completed:** 2026-07-15T22:07:03Z
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

- GET review payload with imovel header, environments, midias (+transcrição), latest AnaliseIa, progress counts; no password hashes
- PATCH description: Zod body, `containsRegulatedTerms` → 400 `REGULATED_TERM`, marks `REVISADO`, computes `descricaoEditada`
- `ItemDescricaoEditor`: save + approve, estado select, inline REGULATED_TERM messaging
- Admin detail page replaced mock “Torneira da Pia” / fake address with live `/revisao` data and ready-for-PDF banner
- Field `revisao-ia` mobile page (online-only) + links from sucesso/resumo; finalize remains `UPDATE_VISTORIA_STATUS` → `EM_REVISAO`

## Task Commits

Each task was committed atomically:

1. **Task 1: Review and description PATCH APIs** — `4215c7d` (feat)
2. **Task 2: Shared editor + admin review page** — `052a656` (feat)
3. **Task 3: Field revisao-ia + finalize navigation** — `f4a36e4` (feat)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `src/app/api/vistorias/[id]/revisao/route.ts` — GET review payload + authz
- `src/app/api/vistorias/[id]/itens/[itemId]/descricao/route.ts` — PATCH → REVISADO
- `src/components/report/ItemDescricaoEditor.tsx` — shared save/approve UI
- `src/app/admin/vistorias/[id]/page.tsx` — data-driven admin review
- `src/app/field/vistorias/[id]/revisao-ia/page.tsx` — mobile AI description review
- `src/app/field/vistorias/[id]/resumo/page.tsx` — link to revisao-ia (finalize unchanged)
- `src/app/field/vistorias/[id]/sucesso/page.tsx` — CTA Revisar descrições (online)
- `src/lib/auth.ts` — `session.user.id = token.sub` for role authz

## Decisions Made

- JWT session now exposes `user.id` (from `token.sub`) — required for VISTORIADOR ownership checks (T-03-15)
- GET midias include `transcricao` (D-03) even though plan shape listed only id/tipo/url
- No PDF finalize button in Plan 04 — banner “pronto para gerar o relatório fotográfico” only
- Offline field review shows explicit message; does not invent offline AI edit store

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] session.user.id for authz**
- **Found during:** Task 1
- **Issue:** JWT session callback set role/empresaId but not `user.id`; vistoriador checks against `session.user.id` would always fail
- **Fix:** `session.user.id = token.sub as string` in `src/lib/auth.ts`
- **Files modified:** `src/lib/auth.ts`
- **Commit:** `4215c7d`

**2. [Rule 2 - D-03] Include audio transcription on review payload**
- **Found during:** Task 1
- **Issue:** CONTEXT D-03 requires showing transcription; plan midia shape omitted it
- **Fix:** serialize `midias[].transcricao` and show in `ItemDescricaoEditor`
- **Files modified:** revisao route, ItemDescricaoEditor, admin + field pages
- **Commit:** `4215c7d` / `052a656`

### Minor discretionary choices

1. ChecklistChegada included in GET revisao for admin sidebar (plan mentioned include in query)
2. Admin list page still has mock address — out of scope (detail page only)

## Known Stubs

- PDF generation / Finalizar relatório button — intentional Plan 03-05
- UI reprocess button after AI failure (D-07 full) — **not in 03-04 PLAN tasks**; status recovers as CAPTURADO from worker only. Carried to deferred for Plan 03-05 or follow-up
- WhatsApp deep link still generic placeholder text (Phase 4)

## Threat Flags

None beyond plan register. Mitigations applied: T-03-14 session required; T-03-15 empresaId + assigned vistoriador; T-03-16 Zod + REGULATED_TERM; T-03-17 no senhaHash; T-03-18 field finalize preserved.

## Self-Check: PASSED

- All created/modified files present on disk
- Commits `4215c7d`, `052a656`, `f4a36e4` present in git log
