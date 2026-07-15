---
phase: 03-relat-rio-pdf-e-pipeline-de-ia
plan: 05
subsystem: report-pdf
tags: [puppeteer, qrcode, public-token, finalize, bullmq, pdf, relatorio-fotografico]

# Dependency graph
requires:
  - phase: 03-relat-rio-pdf-e-pipeline-de-ia
    provides: BullMQ generate-pdf queue + Relatorio model (03-01)
  - phase: 03-relat-rio-pdf-e-pipeline-de-ia
    provides: Human review REVISADO gate + admin review UI (03-04)
provides:
  - Opaque UUID public report token (tokenPublico, no expiry MVP)
  - Public page /public/r/[token] minimal cover + PDF download (D-14)
  - Print template ?print=1 for Puppeteer (capa + 1 item/page + QR)
  - POST /api/vistorias/[id]/finalizar with media-item REVISADO hard gate
  - Worker processGeneratePdf + Relatorio GERADO + version history
  - Admin finalize/regenerate PDF + copy public link + history panel
affects:
  - Phase 4 WhatsApp send / contestação (public CTAs deferred)
  - Runtime requires prisma db push + Redis + worker + APP_URL

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Opaque UUID tokenPublico + DB verify (revocable); no JWT in URL path"
    - "Same React template for public+PDF; mode=public|print (D-10/D-14)"
    - "Puppeteer page.goto(APP_URL/public/r/{token}?print=1) → A4 PDF"
    - "Relatorio.historicoGeracoes JSON audit on each gen/regen (D-18/D-19)"
    - "Finalize gate: only items with FOTO+AUDIO must be REVISADO (D-16)"

key-files:
  created:
    - src/lib/report/token.ts
    - src/lib/report/load-public-report.ts
    - src/lib/pdf/generate-relatorio-pdf.ts
    - src/components/report/RelatorioFotograficoView.tsx
    - src/app/api/public/relatorio/[token]/route.ts
    - src/app/api/public/relatorio/[token]/pdf/route.ts
    - src/app/api/vistorias/[id]/finalizar/route.ts
    - worker/processors/generate-pdf.ts
  modified:
    - src/app/public/r/[token]/page.tsx
    - src/app/admin/vistorias/[id]/page.tsx
    - src/app/api/vistorias/[id]/revisao/route.ts
    - worker/index.ts
    - src/lib/queue/queues.ts
    - src/lib/queue/jobs.ts
    - prisma/schema.prisma
    - env.example

key-decisions:
  - "D-14 override: public page is cover+PDF download only, not item gallery"
  - "Print mode ?print=1 shares template for Puppeteer full layout (D-09–D-13)"
  - "Token = opaque UUID, expiracaoToken null (D-17); no expiry MVP"
  - "Finalize gate only media-complete items (D-16 CONTEXT over plan all-items)"
  - "historicoGeracoes Json + versaoAtual on Relatorio for regen audit (D-18)"
  - "PDF worker concurrency 1; storage upload with local public/relatorios fallback"

patterns-established:
  - "Public APIs under /api/public/* are token-gated, no NextAuth session"
  - "enqueueGeneratePdf removes completed/failed jobId so regenerate re-queues"
  - "CREA disclaimer discreet footer text; title always Relatório Fotográfico"

requirements-completed: [SC-03, PDF-01]

# Metrics
duration: ~7min
completed: 2026-07-15
---

# Phase 3 Plan 05: PDF + Public Token Summary

**Finalize after human review enqueues Puppeteer PDF with QR-linked public token; public page is minimal cover + download (D-14), print mode supplies full photographic layout**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-07-15T22:10:02Z
- **Completed:** 2026-07-15T22:17:00Z
- **Tasks:** 3/3
- **Files modified:** 16

## Accomplishments

- Opaque `tokenPublico` UUID with DB verify (no expiry MVP per D-17); public JSON + PDF stream APIs
- `RelatorioFotograficoView` dual mode: **public** = capa + download only (D-14, no contest CTAs); **print** = capa + 1 item/page + discreet cover QR + prominent last-page QR (D-09–D-13)
- Worker `generate-pdf` (concurrency 1) renders `?print=1`, uploads PDF, upserts `Relatorio` GERADO with version/history, sets vistoria FINALIZADA
- POST `/finalizar` authz admin|vistoriador, hard-blocks pending media items, creates token, enqueues PDF; admin UI finalize/regenerate + copy link + history

## Task Commits

Each task was committed atomically:

1. **Task 1: Public report token + data loader + public page** - `c754070` (feat)
2. **Task 2: PDF generator processor with QR code** - `eb68e58` (feat)
3. **Task 3: Finalize API + admin button gate** - `46c47f7` (feat)

**Plan metadata:** docs commit (SUMMARY + STATE + ROADMAP)

## Files Created/Modified

- `src/lib/report/token.ts` — create/verify opaque public tokens
- `src/lib/report/load-public-report.ts` — DTO loader; omits incomplete media; no CPF
- `src/components/report/RelatorioFotograficoView.tsx` — shared HTML template public/print
- `src/app/public/r/[token]/page.tsx` — token-gated server page + QR
- `src/app/api/public/relatorio/[token]/route.ts` — public JSON DTO
- `src/app/api/public/relatorio/[token]/pdf/route.ts` — token-gated PDF download
- `src/lib/pdf/generate-relatorio-pdf.ts` — Puppeteer A4 buffer
- `worker/processors/generate-pdf.ts` — job processor + Relatorio persistence
- `worker/index.ts` — registers generate-pdf worker
- `src/app/api/vistorias/[id]/finalizar/route.ts` — finalize + enqueue
- `src/app/admin/vistorias/[id]/page.tsx` — finalize/regenerate UI + history
- `src/app/api/vistorias/[id]/revisao/route.ts` — exposes relatorio/urlPublica/history
- `src/lib/queue/queues.ts` / `jobs.ts` — regenerate-safe enqueue + motivo
- `prisma/schema.prisma` — `versaoAtual`, `historicoGeracoes` on Relatorio
- `env.example` — worker/PDF notes

## Decisions Made

- **CONTEXT D-14 wins over plan gallery:** public page intentionally minimal (cover + PDF download); full item layout only for `?print=1` / PDF
- **D-16 media gate:** finalize checks items with FOTO+AUDIO only (not every checklist row)
- **D-17:** `expiracaoToken` always null on create
- **D-18/D-19:** overwrite same storage key path; append JSON history visible on admin (and via revisao API for vistoriador)
- **D-20:** PATCH description still sets REVISADO — re-review + manual regenerate required after prior PDF

## Deviations from Plan

### Auto-fixed / CONTEXT overrides

**1. [Rule 2 - CONTEXT] Public page is D-14 minimal, not full digital gallery**
- **Found during:** Task 1
- **Issue:** Plan 03-05 described full item-by-item public gallery with optional contest links
- **Fix:** Implemented cover + PDF download only; hid contestação/confirm CTAs from public view; full layout reserved for print/PDF
- **Files modified:** `RelatorioFotograficoView.tsx`, `public/r/[token]/page.tsx`
- **Commit:** `c754070`

**2. [Rule 2 - CONTEXT] Finalize gate uses media-complete items (D-16), not all items**
- **Found during:** Task 3
- **Issue:** Plan text said all items REVISADO; CONTEXT D-16/D-11 limit report and gate to full media
- **Fix:** Server + admin UI gate on FOTO+AUDIO items only
- **Files modified:** `finalizar/route.ts`, admin page
- **Commit:** `46c47f7`

**3. [Rule 2 - CONTEXT] Token no expiry (D-17)**
- **Found during:** Task 1
- **Issue:** Plan mentioned PUBLIC_REPORT_TOKEN_EXPIRES_IN / expiresAt Date
- **Fix:** Opaque UUID with `expiracaoToken: null`; verify allows null expiry
- **Commit:** `c754070`

**4. [Rule 2 - Missing critical] Regeneration history fields + PDF download route**
- **Found during:** Tasks 1–3
- **Issue:** D-18/D-19 require version history; public download needs token-gated stream
- **Fix:** `versaoAtual` + `historicoGeracoes` on Relatorio; `/api/public/relatorio/[token]/pdf`
- **Commits:** `c754070`, `eb68e58`, `46c47f7`

## Known Stubs

- Public routes `confirmar/` and `contestar/[itemId]/` still exist as Phase 4 placeholders but are **not linked** from the D-14 public page
- UI reprocess-after-AI-failure button (D-07 full) still deferred from 03-03/03-04
- Live `prisma db push` still deferred — code targets updated schema; runtime needs Postgres push for new Relatorio columns

## Threat Flags

None beyond plan register. Mitigations applied:
- T-03-18 random UUID token + expiry-or-null check
- T-03-19 no documento/CPF on public DTO
- T-03-20 server-side REVISADO gate
- T-03-21 session + empresa/assignment authz
- T-03-22 PDF worker concurrency 1

## Auth Gates

None during execution.

## Self-Check: PASSED

- FOUND: `src/lib/report/token.ts`
- FOUND: `src/lib/report/load-public-report.ts`
- FOUND: `src/lib/pdf/generate-relatorio-pdf.ts`
- FOUND: `src/components/report/RelatorioFotograficoView.tsx`
- FOUND: `src/app/api/vistorias/[id]/finalizar/route.ts`
- FOUND: `worker/processors/generate-pdf.ts`
- FOUND: commits `c754070`, `eb68e58`, `46c47f7`
- `npx tsc --noEmit` → OK
