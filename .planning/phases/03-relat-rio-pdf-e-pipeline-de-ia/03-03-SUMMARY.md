---
phase: 03-relat-rio-pdf-e-pipeline-de-ia
plan: 03
subsystem: pipeline
tags: [bullmq, worker, stt, multimodal, media-upload, field-finalize, prisma]

# Dependency graph
requires:
  - phase: 03-relat-rio-pdf-e-pipeline-de-ia
    provides: Queue contracts enqueueAiDescribeItem + StorageProvider (03-01)
  - phase: 03-relat-rio-pdf-e-pipeline-de-ia
    provides: AIRouter { data, meta } + mapItemStateToPrisma (03-02)
provides:
  - processAiDescribeItem two-stage STT → description → AnaliseIa/Item persistence
  - worker/index.ts BullMQ consumer (npm run worker)
  - Media POST ownership bind + CAPTURADO + AI enqueue when FOTO+AUDIO
  - UPDATE_VISTORIA_STATUS field finalize → EM_REVISAO without checklist wipe
affects:
  - 03-04 review APIs / reprocess UI
  - 03-05 PDF generation worker registration

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Worker reloads Item/Midia from Prisma by id — never trusts job file paths"
    - "AIRouter results consumed only as { data, meta }"
    - "Field status via UPDATE_VISTORIA_STATUS — never status-only UPDATE_CHECKLIST"
    - "Enqueue soft-fail: media 201 + aiEnqueue:false if Redis down"

key-files:
  created:
    - worker/processors/ai-describe-item.ts
    - worker/index.ts
  modified:
    - src/app/api/vistorias/[id]/itens/[itemId]/midia/route.ts
    - src/app/api/vistorias/[id]/route.ts
    - src/lib/db/idb.ts
    - src/app/field/vistorias/[id]/resumo/page.tsx
    - env.example

key-decisions:
  - "First captured FOTO (D-08) + latest AUDIO for multimodal input"
  - "Final BullMQ failure resets Item.status to CAPTURADO for manual reprocess (D-07 partial)"
  - "Relative imports from worker/ to src/lib for tsx path reliability"
  - "Media enqueue failure does not roll back midia.create (source of truth)"

patterns-established:
  - "Tenant bind: item.ambiente.vistoriaId === job/path vistoriaId or UnrecoverableError/404"
  - "Status machine CAPTURADO → EM_ANALISE → ANALISADO (success) or CAPTURADO (not ready/final fail)"
  - "Field finish local+server EM_REVISAO via dedicated mutation action"

requirements-completed: [SC-01, PIPE-01]

# Metrics
duration: ~5min
completed: 2026-07-15
---

# Phase 3 Plan 03: Async AI Pipeline + Field Finalize Summary

**BullMQ worker runs STT→multimodal description with {data,meta} persistence; media sync enqueues jobs after ownership checks; field finalize uses UPDATE_VISTORIA_STATUS → EM_REVISAO without wiping checklist**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-15T21:55:45Z
- **Completed:** 2026-07-15T22:00:52Z
- **Tasks:** 3/3
- **Files modified:** 7

## Accomplishments

- `processAiDescribeItem`: tenant bind (T-03-13), CAPTURADO when media incomplete, STT → `Midia.transcricao`, multimodal → `AnaliseIa` + Item `ANALISADO` / `descricaoFinal` / `estadoConservacao`
- Standalone `npm run worker` entry with concurrency 2 and SIGINT/SIGTERM graceful close
- Media POST: session auth, item↔vistoria ownership, optional empresaId check, CAPTURADO, enqueue when FOTO+AUDIO (D-05/D-06)
- Critical fix: resumo finalize no longer sends status-only payload through `UPDATE_CHECKLIST` (T-03-18)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement AI describe item processor** — `16a9736` (feat)
2. **Task 2: Create worker entrypoint** — `f0e9204` (feat)
3. **Task 3: Media enqueue, ownership, field-finalize status** — `c6a6ed7` (feat)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `worker/processors/ai-describe-item.ts` — STT + description processor, AnaliseIa persistence
- `worker/index.ts` — BullMQ Worker for `ai-describe-item`
- `src/app/api/vistorias/[id]/itens/[itemId]/midia/route.ts` — ownership + enqueue
- `src/app/api/vistorias/[id]/route.ts` — `UPDATE_VISTORIA_STATUS` / `FINALIZAR_CAMPO`
- `src/lib/db/idb.ts` — `EM_REVISAO` + mutation action union
- `src/app/field/vistorias/[id]/resumo/page.tsx` — finalize → EM_REVISAO
- `env.example` — worker REDIS_URL + GEMINI_API_KEY note

## Decisions Made

- Multimodal uses **first** FOTO by `uploadedAt` (D-08) and **latest** AUDIO
- On exhausted retries, item returns to `CAPTURADO` with `console.error` (UI reprocess button still Plan 03-04 / D-07)
- Storage bytes loaded via local `/uploads/` path first, else signed URL fetch (no StorageProvider interface change)
- `CONCLUIDA` legacy payload maps to server `EM_REVISAO`; `FINALIZADA` rejected on field path (400)

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

### Minor discretionary choices (within Claude's Discretion / CONTEXT)

1. **D-08 first photo over plan "latest FOTO"** — CONTEXT wins; implemented first captured photo.
2. **DELETE_MIDIA / UPDATE_ITEM_STATUS ownership** — added vistoriaId bind on those branches (Rule 2 security, T-03-09 class) while implementing Task 3.

## Known Stubs

- PDF worker not registered — intentional TODO in `worker/index.ts` for Plan 03-05.
- UI reprocess button after AI failure — Plan 03-04 (D-07 partial: status recoverable as CAPTURADO only).

## Threat Flags

None beyond plan threat model mitigations applied (T-03-09, T-03-10, T-03-11, T-03-12, T-03-13, T-03-18).

## Auth Gates

None.

## Self-Check: PASSED

- FOUND: `worker/processors/ai-describe-item.ts`
- FOUND: `worker/index.ts`
- FOUND: commits `16a9736`, `f0e9204`, `c6a6ed7`
- FOUND: midia route calls `enqueueAiDescribeItem`
- FOUND: resumo uses `UPDATE_VISTORIA_STATUS` + `EM_REVISAO`
