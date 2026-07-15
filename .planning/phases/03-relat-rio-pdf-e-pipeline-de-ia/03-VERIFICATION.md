---
phase: 03-relat-rio-pdf-e-pipeline-de-ia
verified: 2026-07-15T22:30:00.000Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 1
overrides:
  - must_have: "Public page /public/r/[token] renders real imovel, ambientes, items, photos, and descricaoFinal from DB when token is valid"
    reason: "CONTEXT D-14 intentionally narrows public UX to capa + PDF download; full item layout is available via ?print=1 for Puppeteer. Data is still loaded from DB (loadPublicReportByToken)."
    accepted_by: "gsd-verifier (CONTEXT D-14)"
    accepted_at: "2026-07-15T22:30:00.000Z"
re_verification: false
human_verification:
  - test: "Upload foto+áudio de um item com Redis + worker + GEMINI_API_KEY ativos"
    expected: "Job ai-describe-item processa; Midia.transcricao preenchida; Item.status=ANALISADO com descricao/descricaoFinal/estadoConservacao"
    why_human: "Requer Redis, worker e provedor de IA reais — não verificável só por grep"
  - test: "Revisar itens no admin e no field (revisao-ia), aprovar e editar descrições"
    expected: "Foto + transcrição + descrição + estado visíveis; Aprovar/Salvar → REVISADO; termos CREA bloqueados na UI"
    why_human: "Fluxo visual e UX de revisão"
  - test: "Finalizar no admin com todos os itens com mídia REVISADO; worker PDF ativo"
    expected: "Token público criado; PDF enfileirado; Relatorio.status=GERADO; link /public/r/{token} com capa + download; QR no PDF (print)"
    why_human: "Puppeteer + storage + APP_URL precisam de runtime real"
  - test: "Regenerar PDF com motivo e conferir histórico na página admin da vistoria"
    expected: "versaoAtual incrementa; historicoGeracoes lista quem/quando/motivo; arquivo sobrescrito"
    why_human: "Auditoria D-18/D-19 em runtime"
---

# Phase 3: Relatório, PDF e Pipeline de IA — Verification Report

**Phase Goal:** Gerar descrições técnicas automáticas (foto + áudio) via IA e produzir o relatório fotográfico em PDF com versão digital pública.

**Verified:** 2026-07-15T22:30:00.000Z  
**Status:** human_needed  
**Re-verification:** No — initial verification  
**Score:** 7/7 must-haves verified (code-level)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **SC-01:** Áudio de cada item é transcrito e a IA gera descrição técnica editável (foto + fala) | ✓ VERIFIED | `midia/route.ts` enfileira `ai-describe-item` só com FOTO+AUDIO; `worker/processors/ai-describe-item.ts` faz STT → multimodal → `Midia.transcricao` + `Item.descricao/descricaoFinal/estadoConservacao` + `status=ANALISADO`; `AIRouter` retorna `{ data, meta }` com Gemini→OpenAI |
| 2 | **SC-02:** Admin/vistoriador revisa e edita todas as descrições antes de finalizar | ✓ VERIFIED | GET `/revisao` + PATCH `/descricao` (authz admin empresa ou vistoriador atribuído); `ItemDescricaoEditor` (Aprovar / Salvar → REVISADO); admin `vistorias/[id]` + field `revisao-ia`; finalize D-16 bloqueia se mídia incompleta de revisão |
| 3 | **SC-03:** Sistema gera PDF + link público com token e QR code | ✓ VERIFIED | POST `/finalizar` cria token UUID + `enqueueGeneratePdf`; `generate-pdf` + Puppeteer `page.pdf`; `Relatorio` upsert GERADO; QR via `qrcode` na capa (discreto) e última página (destaque) em modo print; público `/public/r/[token]` |
| 4 | Schema/storage/BullMQ contracts suportam pipeline e relatório | ✓ VERIFIED | `estadoConservacao`, `transcricao`, `EM_REVISAO`, `versaoAtual`, `historicoGeracoes`; `getStorageProvider` R2/MinIO; filas `ai-describe-item` + `generate-pdf` tipadas |
| 5 | **D-14:** Página pública MVP = capa + download PDF (não galeria completa) | ✓ VERIFIED | `RelatorioFotograficoView` mode `public` só capa+download; `print` para Puppeteer com 1 item/página |
| 6 | **D-16:** Gate rígido — itens com mídia completa devem estar REVISADO antes de finalizar | ✓ VERIFIED | `finalizar/route.ts` filtra `hasFullMedia` e retorna 400 `REVIEW_INCOMPLETE`; admin UI `canFinalize` espelha a regra |
| 7 | **D-18:** Regenerar PDF sobrescreve arquivo e mantém histórico de versões | ✓ VERIFIED | `processGeneratePdf` incrementa `versaoAtual`, append em `historicoGeracoes`, sobrescreve key `relatorios/{id}.pdf`; admin mostra histórico |

**Score:** 7/7 truths verified (code-level)

### CONTEXT decisions checked

| Decision | Status | Notes |
|----------|--------|-------|
| D-01..D-04 Review flow | ✓ | Admin + field; um-a-um Aprovar/Editar; foto+desc+estado+transcrição; field review pós `EM_REVISAO` |
| D-05/D-06 Enqueue on media sync | ✓ | Enfileira ao ter foto+áudio; soft-fail se Redis down (`aiEnqueue:false`) |
| D-07 Failure UX + reprocess button | ⚠️ PARTIAL | Worker reseta para `CAPTURADO` após retries; **sem botão reprocessar na UI** (STATE: deferred follow-up) |
| D-08 First photo only | ✓ | `selectMedia` usa primeira FOTO + último AUDIO |
| D-09..D-13 PDF layout | ✓ | Capa + 1 item/página; mesmo template; omit sem mídia; título Relatório Fotográfico; QR discreto/destaque; disclaimer CREA discreto |
| D-14 Public minimal | ✓ | Override de PLAN 03-05 full-gallery truth |
| D-15 Admin ou vistoriador finalizam | ⚠️ PARTIAL | API authz permite ambos; **só admin UI** tem botão Finalizar/Regenerar (field `revisao-ia` não chama `/finalizar`) |
| D-16 Gate REVISADO | ✓ | |
| D-17 Token sem expiração MVP | ✓ | `createPublicReportToken` → `expiracaoToken: null` |
| D-18/D-19 Histórico regeneração | ⚠️ PARTIAL | Persistido + **visível no admin**; API devolve a vistoriador, mas field UI **não renderiza** histórico |
| D-20 Pós-PDF: re-revisão + regen manual | ✓ | Edit → REVISADO; finalize/regen manual; sem auto-regen |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | estados IA/revisão/relatório | ✓ VERIFIED | `EM_REVISAO`, `estadoConservacao`, `transcricao`, `versaoAtual`, `historicoGeracoes` |
| `src/lib/storage/*` | StorageProvider R2/MinIO | ✓ VERIFIED | Factory + S3 upload/signedUrl/delete |
| `src/lib/queue/*` | Filas tipadas + enqueue | ✓ VERIFIED | Lazy Proxy; jobIds `ai-{itemId}` / `pdf-{vistoriaId}` |
| `src/lib/ai/router.ts` | STT + multimodal `{data,meta}` | ✓ VERIFIED | Gemini first, fallback OpenAI; no agent frameworks |
| `src/lib/ai/guardrails.ts` + schemas | CREA/Zod | ✓ VERIFIED | 22 vitest tests passing |
| `worker/index.ts` | Workers AI + PDF | ✓ VERIFIED | concurrency 2 / 1; SIGINT/SIGTERM |
| `worker/processors/ai-describe-item.ts` | Pipeline STT→desc | ✓ VERIFIED | Substantive + tenant check UnrecoverableError |
| `worker/processors/generate-pdf.ts` | PDF + Relatorio | ✓ VERIFIED | Puppeteer buffer + history + FINALIZADA |
| `src/app/api/.../midia/route.ts` | Enqueue on sync | ✓ VERIFIED | Gate FOTO+AUDIO |
| `src/app/api/.../revisao` + `descricao` | Review APIs | ✓ VERIFIED | GET payload D-03; PATCH REVISADO |
| `src/app/api/.../finalizar` | Token + PDF job | ✓ VERIFIED | D-15/D-16 |
| `src/lib/report/*` + `src/lib/pdf/*` | Token/load/PDF | ✓ VERIFIED | Opaque UUID + loadPublicReportByToken + puppeteer |
| `src/components/report/*` | Editor + template | ✓ VERIFIED | ItemDescricaoEditor + RelatorioFotograficoView |
| `src/app/public/r/[token]/page.tsx` | Público | ✓ VERIFIED | D-14 public / print |
| `src/app/admin/vistorias/[id]/page.tsx` | Admin review+finalize | ✓ VERIFIED | Wired to revisao/finalizar |
| `src/app/field/.../revisao-ia/page.tsx` | Field review | ✓ VERIFIED | Online-only; editor wired |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| midia POST | `enqueueAiDescribeItem` | after DB write, if FOTO+AUDIO | ✓ WIRED | soft-fail keeps 201 |
| ai-describe worker | `AIRouter` + Prisma | STT then generateDescription | ✓ WIRED | reads `.data`/`.meta` |
| ItemDescricaoEditor | PATCH `/descricao` | fetch + onSaved | ✓ WIRED | admin + field |
| admin page | GET `/revisao` | useEffect load | ✓ WIRED | |
| finalizar POST | `enqueueGeneratePdf` | after token | ✓ WIRED | 202 + urlPublica |
| generate-pdf | Puppeteer `page.pdf` | `generateRelatorioPdfBuffer` | ✓ WIRED | `?print=1` |
| generate-pdf | QR public URL | public page QRCode.toDataURL | ✓ WIRED | cover + last page |
| public page | `loadPublicReportByToken` | verify token DB | ✓ WIRED | |
| field resumo | `UPDATE_VISTORIA_STATUS` → EM_REVISAO | idb + sync | ✓ WIRED | never FINALIZADA via field |
| sucesso | `revisao-ia` | Link | ✓ WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Real data? | Status |
|----------|---------------|--------|------------|--------|
| Admin review UI | `data` ReviewPayload | GET `/api/vistorias/{id}/revisao` → Prisma | Yes (DB) | ✓ FLOWING |
| Field revisao-ia | `data` ReviewPayload | same API | Yes (DB) | ✓ FLOWING |
| ItemDescricaoEditor | PATCH body → item | Prisma item.update | Yes | ✓ FLOWING |
| Public page | `report` PublicReportDto | `loadPublicReportByToken` → Prisma | Yes | ✓ FLOWING |
| PDF worker | print HTML from public URL | Puppeteer goto APP_URL | Runtime-dependent | ✓ WIRED (needs APP_URL live) |
| AI worker | transcript + description | AIRouter providers | Runtime-dependent | ✓ WIRED (needs keys) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| AI unit suite | `npx vitest run tests/ai-eval` | 3 files, 22 tests passed | ✓ PASS |
| Key modules exist | path checks on lib/ai, queue, worker, report, pdf | All present | ✓ PASS |
| Worker script | `package.json` `"worker": "tsx worker/index.ts"` | Present | ✓ PASS |
| Live AI/PDF E2E | — | Not run (known env gap) | ? SKIP |

### Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| — | — | No phase probes declared / no `scripts/**/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SC-01 | 03-01..03-03 | Transcrição + descrição IA editável | ✓ SATISFIED | Worker + AIRouter + midia enqueue |
| SC-02 | 03-04 | Revisão humana admin/field | ✓ SATISFIED | revisao + descricao + UIs |
| SC-03 | 03-01, 03-05 | PDF + link público + QR | ✓ SATISFIED | finalize + generate-pdf + public |
| PIPE-01 | 03-01..03-03 | Pipeline assíncrono BullMQ | ✓ SATISFIED | queues + worker |
| AI-01/AI-02 | 03-02 | Router free-tier + guardrails | ✓ SATISFIED | router + vitest |
| REV-01 | 03-04 | Human edit gate | ✓ SATISFIED | REVISADO path |
| PDF-01 | 03-05 | PDF Puppeteer + token | ✓ SATISFIED | pdf lib + token + public |

No `.planning/REQUIREMENTS.md` file present — coverage taken from PLAN `requirements:` + ROADMAP SCs.

### Anti-Patterns Found

| File | Line / area | Pattern | Severity | Impact |
|------|-------------|---------|----------|--------|
| UI review surfaces | — | D-07 reprocess button absent | ⚠️ Warning | Falha IA recuperável só via retry BullMQ / re-upload; sem CTA manual |
| `field/.../revisao-ia` | end of page | No POST `/finalizar` | ⚠️ Warning | D-15 parcial: vistoriador revisa no field mas finaliza PDF só via API ou admin |
| `field/.../revisao-ia` | types omit `relatorio` | D-19 history not rendered | ⚠️ Warning | Histórico só no admin (API já retorna) |
| `public/.../contestar` + `confirmar` | Phase 4 stubs | Placeholder pages still exist | ℹ️ Info | Deferred Phase 4; D-14 public não linka CTAs |
| Runtime | — | `prisma db push` not applied on executor | ℹ️ Info | Known env gap — schema in repo + generate done; do not fail solely for this |

No `TBD`/`FIXME`/`XXX` debt markers in Phase 3 implementation files. Input `placeholder=` attributes are UI copy, not stubs.

### Human Verification Required

### 1. Pipeline IA end-to-end
**Test:** Com Redis + `npm run worker` + `GEMINI_API_KEY`, capturar foto+áudio de um item e sincronizar.  
**Expected:** Item vai CAPTURADO → EM_ANALISE → ANALISADO; transcrição e descrição técnica no painel de revisão.  
**Why human:** Provedores e fila reais.

### 2. Revisão admin + field
**Test:** Abrir admin `/admin/vistorias/{id}` e field `/field/vistorias/{id}/revisao-ia`; aprovar um item e editar outro.  
**Expected:** Status REVISADO; progresso atualiza; termos “laudo/perícia” rejeitados.  
**Why human:** UX visual.

### 3. Finalizar + PDF + público
**Test:** Com todos itens com mídia REVISADOS, clicar Finalizar no admin; aguardar worker; abrir link público.  
**Expected:** Capa + “Baixar PDF”; PDF com capa, 1 item/página, QR; Relatorio GERADO.  
**Why human:** Puppeteer + storage + browser.

### 4. Regeneração com histórico
**Test:** Regenerar PDF com motivo; recarregar admin.  
**Expected:** Nova versão no histórico; link/PDF atualizados.  
**Why human:** Auditoria runtime.

### Gaps Summary

**No BLOCKER gaps against the three roadmap success criteria.** Implementation is substantive and wired end-to-end in code.

**Warnings (non-blocking for phase goal, follow-up recommended):**
1. **D-07** — botão reprocessar IA ausente (já listado em STATE como deferred).
2. **D-15 UI field** — vistoriador não tem botão de finalizar/gerar PDF no app de campo (API permite).
3. **D-19 field** — histórico de regeneração não exibido no field (admin OK).
4. **Runtime** — db push / live AI / Redis / Puppeteer dependem do ambiente do operador.

**Deferred to Phase 4 (by design):** WhatsApp, contestação/confirmação cliente, galeria pública completa.

---

_Verified: 2026-07-15T22:30:00.000Z_  
_Verifier: Claude (gsd-verifier)_
