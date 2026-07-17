# Phase 4 — Envio e Contestação — Summary

**Completed:** 2026-07-17  
**Status:** Code complete (DB migrate + human UAT pending)

## Delivered

### Public client experience
- Galeria de itens com foto + descrição na `/public/r/[token]`
- CTAs Contestar item / Confirmar recebimento
- View tracking (`totalVisualizacoes`, `visualizadoEm`, status VISUALIZADO)
- Prazo de contestação: 7 dias (`CONTESTACAO_PRAZO_DIAS`)

### APIs
- `POST /api/public/relatorio/[token]/contestar`
- `POST /api/public/relatorio/[token]/confirmar`
- `POST /api/vistorias/[id]/marcar-enviado`
- `GET /api/admin/contestacoes`
- `PATCH /api/admin/contestacoes/[id]`

### Admin / Field
- Contestações com dados reais + responder ACEITA/REJEITADA/EM_ANALISE
- WhatsApp + “Marcar como enviado” no admin da vistoria e no field pós-PDF

### Schema
- `Contestacao.nomeCliente` (`nome_cliente`)
- Migration `20260717140000_phase4_contestacao_fields`

## Ops

```bash
npx prisma migrate deploy
# or db push
```

## Deferred
- E-mail automático de notificação
- Assinatura ICP / CPF na confirmação
- UI config de prazo por empresa
