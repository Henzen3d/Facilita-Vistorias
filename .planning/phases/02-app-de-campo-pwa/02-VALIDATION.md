---
phase: 02
slug: app-de-campo-pwa
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-14
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (specified in package.json: `"test": "vitest run"`) |
| **Config file** | none — vitest.config.* not found (needs Wave 0 creation) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 1 | offline-storage | T-02-01 | Pre-loaded inspections stored in IndexedDB | unit | `npx vitest run src/lib/db/__tests__/idb.test.ts -t "preload"` | ❌ W0 | ⬜ pending |
| {N}-01-02 | 01 | 1 | offline-storage | T-02-01 | IndexedDB schema matches Prisma model structure | unit | `npx vitest run src/lib/db/__tests__/idb.test.ts -t "schema"` | ❌ W0 | ⬜ pending |
| {N}-01-03 | 01 | 1 | camera-capture | T-02-03 | `<input capture>` triggers native camera and returns Blob | integration | `npx vitest run src/hooks/__tests__/useCamera.test.ts` | ❌ W0 | ⬜ pending |
| {N}-01-04 | 01 | 1 | audio-record | T-02-04 | MediaRecorder produces playable audio Blob with duration | integration | `npx vitest run src/hooks/__tests__/useAudioRecorder.test.ts` | ❌ W0 | ⬜ pending |
| {N}-01-05 | 01 | 1 | sync-engine | T-02-05 | Pending items synced to API on reconnect | integration | `npx vitest run src/lib/sync/__tests__/engine.test.ts` | ❌ W0 | ⬜ pending |
| {N}-01-06 | 01 | 1 | sync-status | T-02-06 | Cloud icon shows correct color per sync state | unit | `npx vitest run src/components/field/__tests__/CloudSyncIcon.test.tsx` | ❌ W0 | ⬜ pending |
| {N}-01-07 | 01 | 1 | checklist | T-02-07 | Protocolo de Chegada fields saved to IndexedDB | unit | `npx vitest run src/components/field/__tests__/ChecklistForm.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration for Next.js + React (jsdom environment, path aliases)
- [ ] `src/lib/db/__tests__/idb.test.ts` — IndexedDB schema and CRUD tests (requires fake-indexeddb or happy-dom)
- [ ] `src/hooks/__tests__/useCamera.test.ts` — Camera hook tests with mocked input element
- [ ] `src/hooks/__tests__/useAudioRecorder.test.ts` — Audio recorder hook tests with mocked MediaRecorder
- [ ] `src/lib/sync/__tests__/engine.test.ts` — Sync engine tests with mocked fetch
- [ ] `src/components/field/__tests__/CloudSyncIcon.test.tsx` — Component rendering tests
- [ ] `src/components/field/__tests__/ChecklistForm.test.tsx` — Form validation tests
- [ ] Framework install: `npm install -D @testing-library/react @testing-library/jest-dom jsdom fake-indexeddb vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PWA loads from cache when offline | offline-ui | Requires device with airplane mode — cannot be simulated reliably in jsdom | Install PWA on mobile device, enable airplane mode, verify pages load from cache |
| Camera opens on mobile device | camera-capture | `<input capture>` behavior depends on OS camera app — not testable in headless env | Tap camera button on real Android/iOS device, verify native camera opens |
| Audio recording on real device | audio-record | MediaRecorder codec negotiation is device-dependent | Tap record button on real device, verify audio is captured and playable |
| Background sync on reconnect | sync-engine | Network state transitions are inherently manual | Complete inspection offline, reconnect to network, verify sync triggers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
