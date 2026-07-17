# Phase 5 — Assinatura Eletrônica Nativa — Summary

**Completed:** 2026-07-17  
**Status:** Code complete (DB migrate + human UAT + worker PDF regen pending)

## Delivered

### Schema
- Campos em `Relatorio`: `assinadoEm`, `assinaturaImagem`, `assinaturaHash`, `assinaturaIp`, `assinaturaDevice`, `assinaturaNome`, `assinaturaCpfHash`, `assinaturaCpfUltimos`
- Enum `StatusRelatorio.ASSINADA`
- Migration `20260717160000_phase5_assinatura`

### API
- `POST /api/public/relatorio/[token]/assinar` — valida CPF (módulo 11), canvas PNG, status CONFIRMADO, contestações abertas; grava hash SHA-256, CPF bcrypt, IP/UA; status `ASSINADA`; enfileira regeneração PDF
- Hard lock HTTP 423 em mutações de vistoria/item/mídia/finalizar/contestar/confirmar quando assinado

### UI pública
- `/public/r/[token]/assinar` — SignaturePad (canvas nativo) + nome + CPF + aceite
- `/public/r/[token]/audit` — log de auditoria (CPF só últimos 3 dígitos)
- Botão "Assinar documento" na página pública quando `podeAssinar`

### PDF
- Página final de auditoria no modo print (Puppeteer)
- Worker `generate-pdf` **não** rebaixa status (preserva ASSINADA/CONFIRMADO/ENVIADO)
- QR do print assinado aponta para `/audit`

### Tests
- `tests/report/cpf.test.ts` (6 cases)

## Ops

```bash
npx prisma migrate deploy
# Redis + APP_URL + npm run worker  # regeneração PDF pós-assinatura
```

## Deferred
- ICP-Brasil / multi-signatários
- E-mail automático pós-assinatura
- Configuração de prazo de assinatura na UI
