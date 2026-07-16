---
status: testing
phase: 03-relat-rio-pdf-e-pipeline-de-ia
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
  - 03-04-SUMMARY.md
  - 03-05-SUMMARY.md
  - 03-VERIFICATION.md
started: 2026-07-15T22:35:00.000Z
updated: 2026-07-15T22:35:00.000Z
---

## Current Test

number: 1
name: Ambiente e cold start
expected: |
  Com Postgres + Redis acessíveis: `npx prisma db push` aplica o schema sem erro;
  `npm run dev` e `npm run worker` sobem sem crash; app responde (login ou página inicial).
awaiting: user response

## Tests

### 1. Ambiente e cold start
expected: Com Postgres + Redis acessíveis, `npx prisma db push` aplica o schema; `npm run dev` e `npm run worker` sobem sem crash; app responde (login ou home).
result: pending

### 2. Pipeline de IA após sync de mídia
expected: Após sync de foto + áudio de um item (com GEMINI/OPENAI keys e worker), a descrição técnica e a transcrição aparecem para revisão (item ANALISADO); sem os dois tipos de mídia, a IA não roda sozinha.
result: pending

### 3. Revisão no admin (aprovar / editar)
expected: No admin, na vistoria em revisão: cada item mostra foto, descrição IA, estado de conservação e transcrição; Aprovar ou Editar+Salvar marca REVISADO; tentar salvar com "laudo"/"laudo técnico" é bloqueado.
result: pending

### 4. Revisão no app de campo
expected: Após finalizar a vistoria em campo (EM_REVISAO), a rota revisao-ia permite o mesmo fluxo Aprovar/Editar online; não é o fluxo durante a captura de mídia.
result: pending

### 5. Gate de finalização (itens pendentes)
expected: Com algum item com foto+áudio ainda não REVISADO, Finalizar relatório é bloqueado (mensagem de revisão incompleta). Com todos REVISADO, o botão/ação de finalizar fica liberado.
result: pending

### 6. Finalizar → token + PDF
expected: Finalizar no admin cria link público e enfileira PDF; após o worker, o relatório fica GERADO e o PDF fica disponível para download (ou link assinado).
result: pending

### 7. Página pública mínima (capa + download)
expected: Abrir `/public/r/{token}` (sem login) mostra capa do Relatório Fotográfico e download do PDF — sem galeria item a item e sem botões de contestar/confirmar (Phase 4).
result: pending

### 8. Conteúdo do PDF (layout + QR)
expected: O PDF baixado/impresso tem capa + um item por página (só itens com mídia), título "Relatório Fotográfico", disclaimer CREA discreto, QR discreto na capa e mais destacado na última página.
result: pending

### 9. Regenerar PDF e histórico
expected: Regenerar PDF (com motivo) sobrescreve o arquivo, incrementa versão e mostra histórico (quem/quando/motivo) na página admin da vistoria.
result: pending

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps

[none yet]
