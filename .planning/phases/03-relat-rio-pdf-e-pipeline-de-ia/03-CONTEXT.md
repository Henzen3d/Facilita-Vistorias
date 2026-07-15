# Phase 3: Relatório, PDF e Pipeline de IA - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning
**Note:** Phase already has 5 plans from a prior `/gsd:plan-phase 3 --skip-research`. User chose **Continue and replan after** — re-run `/gsd:plan-phase 3` so plans absorb these decisions.

<domain>
## Phase Boundary

Após a captura em campo (Phase 2), esta fase entrega:

1. **Pipeline de IA assíncrono** — transcrição de áudio + descrição técnica editável por item (foto + fala)
2. **Revisão humana** — admin e vistoriador aprovam/editam descrições antes de fechar o relatório
3. **Relatório fotográfico** — PDF (Puppeteer) + link público com token + QR code

**Não inclui (Phase 4):** envio WhatsApp, contestação/confirmação do cliente, prazos de contestação.

</domain>

<decisions>
## Implementation Decisions

### Onde e como se revisa a IA
- **D-01:** Revisão e edição por **admin e vistoriador** (painel admin + app de campo)
- **D-02:** Fluxo **um a um**: por item, botões **Aprovar** (sem alterar texto) ou **Editar + salvar** → status `REVISADO`
- **D-03:** Tela de revisão mostra **foto + descrição IA + estado de conservação + transcrição** do áudio
- **D-04:** No campo, o fluxo de revisão (`revisao-ia`) só inicia **depois de finalizar a vistoria em campo** (status `EM_REVISAO`) — não durante a captura item a item

### Quando a IA processa cada item
- **D-05:** Enfileirar job de IA **assim que foto + áudio do item sincronizam** no servidor (não só no finalize)
- **D-06:** Mínimo para processar: **foto + áudio obrigatórios** — sem os dois, não enfileira
- **D-07:** Falha de IA: **status de falha visível + botão reprocessar** na UI; BullMQ também retenta em background
- **D-08:** Com várias fotos no item: multimodal usa **somente a foto principal (primeira capturada) + áudio**; demais fotos entram no relatório se tiverem mídia, mas não no input multimodal

### Formato do relatório (PDF + digital)
- **D-09:** Layout PDF: **capa + 1 item por página** (foto grande + `descricaoFinal` + estado)
- **D-10:** PDF e versão digital usam o **mesmo template HTML/React** (Puppeteer renderiza esse template)
- **D-11:** Conteúdo: **capa + todos os itens com mídia completa (foto+áudio) + QR**; **omitir itens sem mídia**
- **D-12:** Título **“Relatório Fotográfico”**; disclaimer CREA **bem discreto, sem destaque** (interno/capa ou rodapé, não em banner alardeado)
- **D-13:** QR code: **discreto na capa** e **com mais destaque na última página** do PDF
- **D-14:** Página pública nesta fase é **leitura mínima: capa + download do PDF** (não a galeria completa item a item — isso pode evoluir na Phase 4 com contestação)

### Finalizar e link público
- **D-15:** **Admin ou vistoriador** podem finalizar o relatório (token + enfileirar PDF)
- **D-16:** **Gate rígido:** todos os itens com mídia (foto+áudio) devem estar `REVISADO` antes de finalizar
- **D-17:** Token **sem expiração no MVP**; revogação manual fica fora de escopo por enquanto
- **D-18:** Regenerar PDF **sobrescreve o arquivo** no storage, mas **mantém log/histórico** (quem / quando / motivo + contagem de versões)
- **D-19:** Histórico de regeneração **visível para admin e vistoriador** na página da vistoria
- **D-20:** Após relatório já gerado: editar descrição exige **re-revisão do item + regerar PDF manualmente** (não auto-regenera)

### Claude's Discretion
- Implementação técnica do AIRouter, filas BullMQ, schema Prisma e storage S3 (já parcialmente especificados em AI-SPEC / plans)
- Formato exato da tabela/modelo de auditoria de regeneração (campos além de userId, timestamp, motivo, versionNumber)
- **Acesso ao link público** (não respondido na sessão): default razoável alinhado à Phase 4 WhatsApp = **qualquer um com o token na URL**, sem senha/CPF no MVP
- Copy exato do disclaimer discreto e posicionamento tipográfico fino no template
- Política de reprocessar após edição de descrição ainda em `EM_REVISAO` (antes do primeiro finalize)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### AI design contract
- `.planning/phases/03-relat-rio-pdf-e-pipeline-de-ia/03-AI-SPEC.md` — Framework (SDKs diretos), pipeline STT→multimodal, CREA/Zod, free-tier-first, falhas críticas

### Arquitetura e integrações
- `SYSTEM_DESIGN.md` §1–5 — BullMQ, Puppeteer, storage S3, token público, modelos Vistoria/Relatorio/AnaliseIa
- `.planning/INTEGRATIONS.md` — Gemini/OpenAI/Claude, MinIO/R2, BullMQ dashboard
- `.planning/STACK.md` — Stack do projeto
- `.planning/PROJECT.md` — Constraints (CREA, custo, mobile-first, offline)

### Prior phase context
- `.planning/phases/02-app-de-campo-pwa/02-CONTEXT.md` — Offline, sync, captura foto/áudio; adiou revisão IA para Phase 3
- `.planning/phases/01-nucleo-de-dados-e-auth/01-CONTEXT.md` — Schema e roles admin/vistoriador

### Existing plans (to reconcile on replan)
- `.planning/phases/03-relat-rio-pdf-e-pipeline-de-ia/03-01-PLAN.md` … `03-05-PLAN.md` — Plans written before this CONTEXT; must be revised to match D-01–D-20 especially **D-14** (public page minimal) and **D-18/D-19** (regen history)

### Design system
- `DESIGN.md` — Tokens de marca Facilita (`#00AEEF`, tipografia, estados)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/public/r/[token]/` — placeholders de relatório público, confirmar e contestar (Phase 4 UI stubs)
- `src/app/field/vistorias/[id]/resumo|sucesso` + rotas de item/`revisao` — fluxo de campo Phase 2
- `src/lib/db/idb.ts` — já tem `descricao`, `descricaoFinal`, `descricaoEditada` no modelo local
- SDKs em `package.json`: openai, @google/generative-ai, @anthropic-ai/sdk, bullmq, zod

### Established Patterns
- App Router Next.js 15, `params: Promise<>`, Tailwind, mobile-first `max-w-md` no field
- Roles NextAuth admin/vistoriador
- Sync de campo com actions na API de vistoria (UPDATE_CHECKLIST etc.)

### Integration Points
- Upload de mídia e sync → ponto de enqueue `ai-describe-item` (D-05/D-06)
- Status `EM_REVISAO` → entrada em revisão (D-04)
- Finalize → token + job PDF (D-15/D-16)
- Worker `tsx` + Redis/BullMQ para IA e PDF

</code_context>

<specifics>
## Specific Ideas

- Revisão de campo só **depois** do resumo/finalizar captura — não misturar com captura de mídia
- Página pública Phase 3 **não** é a galeria rica item-a-item; é **capa + download PDF** (cliente “leve”)
- QR: **discreto na capa**, **destacado na última página**
- Disclaimer CREA **sem destaque visual** — compliance sem assustar o cliente
- Regenerar PDF mantém **histórico de versões** (quem/quando/motivo), não só sobrescreve em silêncio
- Pós-finalização: edição → re-revisão + regerar manual (evita PDF silencioso desatualizado)

</specifics>

<deferred>
## Deferred Ideas

- Envio do link por WhatsApp (deep link wa.me) — **Phase 4**
- Contestação e confirmação pelo cliente na página pública — **Phase 4** (ocultar/remover CTAs de contestar na UI pública desta fase)
- Galeria pública completa por item (se desejada além do PDF) — pode voltar na Phase 4 junto com contestação
- Expiração/revogação de token e gate CPF/senha — backlog / pós-MVP
- Comparação automática entrada × saída — backlog
- Assinatura digital — backlog

</deferred>

---

*Phase: 03-relat-rio-pdf-e-pipeline-de-ia*
*Context gathered: 2026-07-15*
