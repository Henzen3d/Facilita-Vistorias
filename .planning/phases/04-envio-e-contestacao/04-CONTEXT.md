# Phase 4: Envio e Contestação — Context

**Gathered:** 2026-07-17  
**Status:** Ready for execution  
**Depends on:** Phase 3 (token + PDF + link público) + 3.2 (finalize no field)

## Phase Boundary

1. **Página pública rica** — cliente vê itens/fotos/descrições (não só capa + PDF)
2. **Contestação por item** — formulário real + persistência + painel admin
3. **Confirmação de recebimento** — nome + timestamp em `Relatorio`
4. **Envio WhatsApp** — deep link `wa.me` com URL pública real; marcar `enviadoEm`
5. **Rastreio leve** — contagem de visualizações / `visualizadoEm`

**Out of scope:** assinatura ICP/DocuSign, e-mail transacional, prazo configurável na UI admin (default env/const), multi-tenant white-label.

## Decisions

| ID | Decision |
|----|----------|
| D-01 | Página pública `/public/r/[token]` em modo cliente: capa + **lista de itens com foto** + CTAs Contestar / Confirmar + download PDF |
| D-02 | Print `?print=1` permanece layout PDF (sem CTAs, sem contagem de view) |
| D-03 | Contestação: `nomeCliente` + `motivo` por item; um contest pendente por item (reenvio bloqueado se PENDENTE/EM_ANALISE) |
| D-04 | Prazo MVP: **7 dias** após `enviadoEm` ou, se null, `geradoEm` (`CONTESTACAO_PRAZO_DIAS`, default 7) |
| D-05 | Confirmação: grava `confirmadoEm`, `nomeQuemConfirmou`, status relatorio `CONFIRMADO` (sem CPF no MVP — LGPD mínimo) |
| D-06 | WhatsApp: deep link manual; botão “Marcar como enviado” seta `enviadoEm` + status `ENVIADO` |
| D-07 | View tracking: ao abrir página pública (não print), incrementa `totalVisualizacoes` e seta `visualizadoEm` se null; status → `VISUALIZADO` se era GERADO/ENVIADO |
| D-08 | Linguagem: “relatório fotográfico” / “documentação técnica” — nunca “laudo” |
| D-09 | Admin contestações: listar PENDENTE, responder ACEITA/REJEITADA/RESOLVIDA com texto |

## Success Criteria

1. Cliente com token válido vê itens com foto e descrição  
2. Cliente contesta item e admin vê na lista real  
3. Cliente confirma recebimento e relatório fica CONFIRMADO  
4. Admin/field abrem WhatsApp com texto contendo o link público  
5. Marcar enviado atualiza `enviadoEm`  

## Existing assets

- `loadPublicReportByToken`, `RelatorioFotograficoView` (public minimal + print)
- Schema: `Contestacao`, `Relatorio` (enviadoEm, visualizadoEm, confirmadoEm…)
- Placeholders: contestar, confirmar, admin contestacoes, assinaturas mock
- Middleware: `/public` já fora do matcher auth
