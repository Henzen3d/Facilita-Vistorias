---
phase: 03-relat-rio-pdf-e-pipeline-de-ia
plan: 02
subsystem: ai
tags: [ai-router, gemini, openai, whisper, zod, crea, guardrails, sharp, vitest]

# Dependency graph
requires:
  - phase: 03-relat-rio-pdf-e-pipeline-de-ia
    provides: AnaliseIa observability fields and queue contracts (03-01)
provides:
  - AIRouter with locked { data, meta } contract (AiResult/AiRunMeta)
  - DescriptionOutputSchema + CREA terminology guardrails
  - downscaleImageBuffer max edge 1024
  - Offline vitest suite under tests/ai-eval
affects:
  - 03-03 worker processors (AnaliseIa persistence via result.data + result.meta)
  - 03-04 review APIs (description text + estadoConservacao)

# Tech tracking
tech-stack:
  added: [sharp]
  patterns:
    - "AIRouter returns { data, meta } only — no lastRunMeta dual contract"
    - "Free-tier Gemini first → OpenAI Whisper / gpt-4o-mini → optional Claude"
    - "CREA sanitize via enforceDescriptionOutput after Zod parse"
    - "Photos downscaled to max 1024 before multimodal transmit"

key-files:
  created:
    - src/lib/ai/schemas.ts
    - src/lib/ai/guardrails.ts
    - src/lib/ai/prompts.ts
    - src/lib/ai/router.ts
    - src/lib/ai/image.ts
    - src/lib/ai/index.ts
    - tests/ai-eval/schemas.test.ts
    - tests/ai-eval/guardrails.test.ts
    - tests/ai-eval/router.fallback.test.ts
    - vitest.config.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Single AiResult<T> return contract for STT and multimodal (Plan 03-03 consumable)"
  - "Gemini model default gemini-2.0-flash matching env.example GEMINI_MODEL"
  - "sharp as direct dependency for 1024 max-edge downscale (JPEG q80)"
  - "Transcript injected only in user/content via buildDescriptionUserText (system prompt static)"

patterns-established:
  - "Provider failover on any failure including 429/503/timeout >10s"
  - "Log provider + latency only — never base64 media"
  - "mapItemStateToPrisma: Novo|Bom|Regular|Ruim → NOVO|BOM|REGULAR|RUIM"

requirements-completed: [SC-01, PIPE-01, AI-01, AI-02]

# Metrics
duration: ~6min
completed: 2026-07-15
---

# Phase 3 Plan 02: AI Router + Guardrails + Evals Summary

**Thin multi-provider AIRouter (Gemini free-tier first → OpenAI/Whisper fallback) with Zod structured output, CREA terminology sanitization, 1024 photo downscale, and offline vitest evals — locked { data, meta } contract only**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-15T18:47:53Z
- **Completed:** 2026-07-15T21:52:42Z
- **Tasks:** 3/3
- **Files modified:** 12

## Accomplishments

- Zod `DescriptionOutputSchema` + `mapItemStateToPrisma` for `EstadoConservacao`
- CREA guardrails: detect/sanitize/enforce for laudo, laudo técnico, perícia/pericia
- `AIRouter.transcribeAudio` and `generateDescription` return only `{ data, meta }` with `AiRunMeta`
- Free-tier Gemini primary with Whisper / gpt-4o-mini fallback and optional Claude third path
- `downscaleImageBuffer` (sharp) max edge 1024 before multimodal calls
- Offline vitest suite: schemas, guardrails, router fallback + contract shape (22 tests green)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Zod schemas, CREA guardrails, Vitest eval suite | c1e1e83 | schemas.ts, guardrails.ts, prompts.ts, tests, vitest.config.ts |
| 2 | AIRouter { data, meta } + 1024 downscale | bf49b78 | router.ts, image.ts, index.ts, package.json |
| 3 | Mocked router fallback unit tests | 580331d | router.fallback.test.ts |

## Files Created/Modified

**Created:**
- `src/lib/ai/schemas.ts` — DescriptionOutputSchema, AiRunMeta, AiResult, mapItemStateToPrisma
- `src/lib/ai/guardrails.ts` — REGULATED_TERMS_REGEX, contains/sanitize/enforce
- `src/lib/ai/prompts.ts` — SYSTEM_DESCRIPTION_PROMPT, STT_PROMPT, buildDescriptionUserText
- `src/lib/ai/router.ts` — AIRouter class (locked contract)
- `src/lib/ai/image.ts` — downscaleImageBuffer
- `src/lib/ai/index.ts` — public re-exports
- `tests/ai-eval/schemas.test.ts`
- `tests/ai-eval/guardrails.test.ts`
- `tests/ai-eval/router.fallback.test.ts`
- `vitest.config.ts`

**Modified:**
- `package.json` / `package-lock.json` — direct `sharp` dependency

## Decisions Made

- **Locked return contract:** both methods return `Promise<AiResult<T>>` — never bare string/DescriptionOutput, never `lastRunMeta`
- **Model defaults:** `GEMINI_MODEL || gemini-2.0-flash`, Whisper `whisper-1`, vision `gpt-4o-mini`, temperature 0.1, max tokens 300
- **CREA sanitize strategy:** replace laudo/laudo técnico → "documentação técnica"; perícia → "constatação"; re-check after sanitize
- **Image prep:** always re-encode via sharp JPEG q80 with longest edge ≤ 1024 for vision providers
- **No heavy frameworks:** only openai, @google/generative-ai, @anthropic-ai/sdk, zod, sharp

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — router methods are fully implemented; offline tests mock SDKs. Live provider keys required only at runtime in Plan 03-03 worker.

## Threat Flags

None beyond plan threat model mitigations (T-03-04…T-03-08, T-03-SC applied).

## Verification

- `npx vitest run tests/ai-eval` — 22/22 passed
- `npx tsc --noEmit` — clean
- No langchain/langgraph/crewai/vercel-ai imports
- No `lastRunMeta` assignment in source

## Self-Check: PASSED

- FOUND: src/lib/ai/router.ts, schemas.ts, guardrails.ts, image.ts, index.ts, prompts.ts
- FOUND: tests/ai-eval/{schemas,guardrails,router.fallback}.test.ts
- FOUND: vitest.config.ts
- FOUND commits: c1e1e83, bf49b78, 580331d
- FOUND package.json sharp dependency
