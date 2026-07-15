---
phase: 03-relat-rio-pdf-e-pipeline-de-ia
plan: 01
subsystem: infra
tags: [prisma, bullmq, ioredis, s3, minio, r2, redis, storage, queue]

# Dependency graph
requires:
  - phase: 01-nucleo-de-dados-e-auth
    provides: Base Prisma schema (Item, Midia, AnaliseIa, Vistoria, Relatorio) and PostgreSQL
  - phase: 02-app-de-campo-pwa
    provides: Field capture/sync of foto+áudio and local /uploads midia paths
provides:
  - Extended Prisma schema (EstadoConservacao, EM_REVISAO, Midia.transcricao, AnaliseIa observability)
  - StorageProvider abstraction (R2/MinIO) via getStorageProvider
  - BullMQ queue contracts ai-describe-item and generate-pdf with typed payloads
  - Regenerated Prisma Client types for Phase 3 fields
affects:
  - 03-02 AIRouter
  - 03-03 worker processors
  - 03-04 review APIs
  - 03-05 PDF generation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "S3-compatible StorageProvider switched by STORAGE_PROVIDER env (r2|minio)"
    - "Lazy BullMQ Queue proxies (Redis connection on first use)"
    - "Typed job payloads only; processors must reload entities by id from Prisma"

key-files:
  created:
    - src/lib/storage/types.ts
    - src/lib/storage/s3.ts
    - src/lib/storage/index.ts
    - src/lib/queue/connection.ts
    - src/lib/queue/jobs.ts
    - src/lib/queue/queues.ts
  modified:
    - prisma/schema.prisma
    - env.example

key-decisions:
  - "Lazy Proxy for BullMQ queues to avoid import-time Redis connection"
  - "Default signed URL TTL 3600s (T-03-01)"
  - "Operator deferred live prisma db push until Postgres/Docker available"

patterns-established:
  - "Storage: getStorageProvider() singleton + resolveLocalUploadPath for /uploads bridge"
  - "Queue: enqueueAiDescribeItem / enqueueGeneratePdf with jobId ai-${itemId} / pdf-${vistoriaId}"
  - "Credentials only from env — never hard-coded"

requirements-completed: [SC-01, SC-03, PIPE-01]

# Metrics
duration: ~25min
completed: 2026-07-15
---

# Phase 3 Plan 01: Schema + Storage + BullMQ Contracts Summary

**Prisma AI/review schema extensions, S3 StorageProvider (R2/MinIO), and typed BullMQ queues for ai-describe-item + generate-pdf**

## Performance

- **Duration:** ~25 min (including human checkpoint)
- **Started:** 2026-07-15T21:36:48Z
- **Completed:** 2026-07-15
- **Tasks:** 3/3 (Task 3 partial: generate done, db push deferred by operator)
- **Files modified:** 8

## Accomplishments

- Extended Prisma schema for AI pipeline: `EstadoConservacao`, `Item.estadoConservacao`, `Midia.transcricao`, `StatusVistoria.EM_REVISAO`, `AnaliseIa` observability fields
- Implemented S3-compatible `StorageProvider` with factory switch on `STORAGE_PROVIDER` (r2 default | minio)
- Defined BullMQ contracts: `QUEUE_AI_DESCRIBE`, `QUEUE_GENERATE_PDF`, typed jobs, lazy queues, enqueue helpers with dedupe jobIds
- Regenerated Prisma Client (`npx prisma generate`) so TypeScript types include new fields for subsequent plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Prisma schema for AI pipeline and review** - `b4165ae` (feat)
2. **Task 2: Implement StorageProvider and BullMQ queue contracts** - `47002ec` (feat)
3. **Task 3: [BLOCKING] Prisma generate and db push** - no code commit (generate only; push deferred — see Known Gap)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `prisma/schema.prisma` — EstadoConservacao, EM_REVISAO, transcricao, observability fields
- `src/lib/storage/types.ts` — StorageProvider interface
- `src/lib/storage/s3.ts` — S3Client implementation (R2/MinIO)
- `src/lib/storage/index.ts` — getStorageProvider + resolveLocalUploadPath
- `src/lib/queue/connection.ts` — getRedisConnection from REDIS_URL
- `src/lib/queue/jobs.ts` — typed payloads + queue name constants
- `src/lib/queue/queues.ts` — aiDescribeQueue, generatePdfQueue, enqueue helpers
- `env.example` — worker + Redis dependency note above AI vars

## Decisions Made

- Lazy Proxy for queue instances so importing `@/lib/queue/queues` does not open Redis until first use
- Default `getSignedUrl` TTL = 3600s; credentials only from env (threat mitigations T-03-01, T-03-03)
- **Operator decision:** skip live `prisma db push` for now (Postgres/Docker unavailable on host); continue with generated client + code for later waves

## Deviations from Plan

### Auto-fixed Issues

None - implementation matched plan for Tasks 1–2.

### Operator-approved skip

**1. [Task 3] Live `prisma db push` deferred**
- **Found during:** Task 3 (Prisma generate and db push)
- **Issue:** `P1001: Can't reach database server at postgres:5432`; Docker CLI/Desktop not installed; localhost:5432 closed
- **Resolution:** Operator approved completing plan documentation path without push. `npx prisma generate` already succeeded.
- **Not used:** `--accept-data-loss` (never invoked)

---

**Total deviations:** 0 auto-fixed; 1 operator-approved deferral  
**Impact on plan:** Schema source + client types ready; **live DB not yet in sync** — must push before runtime use of new columns/enums.

## Known Gap / Deferred

> **Schema not applied to live database.**

| Item | Status |
|------|--------|
| `npx prisma validate` | ✅ Done (Task 1) |
| `npx prisma generate` | ✅ Done (Task 3) — client includes `EstadoConservacao`, `estadoConservacao`, `EM_REVISAO`, etc. |
| `npx prisma db push` | ⏸️ **Deferred by operator** until PostgreSQL is reachable |

**Command to run later** (when Postgres is up; point `DATABASE_URL` at a host-reachable address, e.g. `127.0.0.1` if port-mapped from Docker):

```bash
npx prisma generate && npx prisma db push
```

Example host-side URL (docker-compose maps `5432:5432`):

```env
DATABASE_URL="postgresql://vistorias:changeme@127.0.0.1:5432/vistorias?schema=public"
```

Do **not** pass `--accept-data-loss` unless an unavoidable destructive change is explicitly reviewed.

## Issues Encountered

- Host environment has no Docker and no local PostgreSQL; `.env` uses Docker-network hostname `postgres`, which does not resolve on the host
- Checkpoint returned; operator chose to defer push rather than block remaining Phase 3 planning/code waves

## User Setup Required

Before running workers or any code that writes the new columns:

1. Start PostgreSQL (`docker compose up -d postgres` or equivalent)
2. Ensure `DATABASE_URL` is reachable from the shell running Prisma
3. Run: `npx prisma generate && npx prisma db push`
4. (Optional) `docker compose up -d redis` before enqueueing jobs

None of the storage/queue env vars require new secrets beyond existing `env.example` placeholders.

## Next Phase Readiness

- **Ready for 03-02 (AIRouter):** types and storage/queue contracts are importable; no LangChain/etc.
- **Ready for 03-03 (worker):** can implement processors against queue names/payloads; will need Redis + DB push for end-to-end
- **Blocker for runtime:** live DB schema push still required before EM_REVISAO / estadoConservacao / transcricao persist

## Threat Flags

None beyond plan register (T-03-01 signed URL TTL, T-03-02 typed payloads, T-03-03 env credentials — all mitigated in this plan).

## Self-Check: PASSED

- [x] `prisma/schema.prisma` contains EstadoConservacao, estadoConservacao, transcricao, EM_REVISAO, latencyMs/usedFallback/guardrailHit/stage
- [x] Storage + queue modules exist with required exports
- [x] Commits `b4165ae`, `47002ec` present on main
- [x] Prisma client generated with new types
- [x] Known gap documented for deferred db push

---
*Phase: 03-relat-rio-pdf-e-pipeline-de-ia*
*Completed: 2026-07-15*
