# Phase 3: Relatório, PDF e Pipeline de IA - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 03-relat-rio-pdf-e-pipeline-de-ia
**Areas discussed:** Onde e como se revisa a IA; Quando a IA processa; Formato do relatório; Finalizar e link público; Histórico de regeneração; (Acesso ao link — defaults)

---

## Onde e como se revisa a IA

| Option | Description | Selected |
|--------|-------------|----------|
| Admin + vistoriador no campo | Painel + app de campo | ✓ |
| Só admin no painel | Campo só captura | |
| Só o vistoriador no campo | Admin só finaliza | |

**User's choice:** Admin + vistoriador no campo

| Option | Description | Selected |
|--------|-------------|----------|
| Um a um Aprovar / Editar | Por item | ✓ |
| Aprovar todos + editar exceções | Bulk | |
| Edição livre em lista | Sem botão aprovar | |

**User's choice:** Um a um com Aprovar / Editar

| Option | Description | Selected |
|--------|-------------|----------|
| Foto + descrição + estado + transcrição | Completo | ✓ |
| Foto + descrição sem transcrição | Limpo | |
| Foto + player áudio + descrição | Áudio em vez de texto | |

**User's choice:** Foto + descrição IA + estado + transcrição

| Option | Description | Selected |
|--------|-------------|----------|
| Após finalizar vistoria (EM_REVISAO) | Pós-resumo | ✓ |
| Durante captura | Por item se sync | |
| Só no escritório | Campo só status | |

**User's choice:** Após finalizar a vistoria (EM_REVISAO)

---

## Quando a IA processa cada item

| Option | Description | Selected |
|--------|-------------|----------|
| Assim que foto+áudio sincronizam | Enqueue no upload | ✓ |
| Só ao finalizar vistoria | Batch | |
| Manual | Botão gerar | |

**User's choice:** Assim que foto+áudio sincronizam

| Option | Description | Selected |
|--------|-------------|----------|
| Foto + áudio obrigatórios | Mínimo | ✓ |
| Só foto basta | Áudio opcional | |
| Qualquer mídia | Foto ou áudio | |

**User's choice:** Foto + áudio obrigatórios

| Option | Description | Selected |
|--------|-------------|----------|
| Status falha + reprocessar | UI + retry | ✓ |
| Retry silencioso | Sem UI | |
| Descrição vazia editável | Manual | |

**User's choice:** Status de falha + botão reprocessar

| Option | Description | Selected |
|--------|-------------|----------|
| Foto principal (primeira) + áudio | Uma desc/item | ✓ |
| Todas as fotos no multimodal | Mais custo | |
| Uma descrição por foto | Modelo diferente | |

**User's choice:** Foto principal (primeira) + áudio

---

## Formato do relatório (PDF + digital)

| Option | Description | Selected |
|--------|-------------|----------|
| Capa + 1 item por página | Legível | ✓ |
| Capa + grade por ambiente | Compacto | |
| You decide | Planner | |

**User's choice:** Capa + 1 item por página

| Option | Description | Selected |
|--------|-------------|----------|
| Mesmo template HTML | Puppeteer = public | ✓ |
| Digital rica / PDF enxuto | Dois designs | |
| PDF independente | Dois designs full | |

**User's choice:** Mesmo template HTML

| Option | Description | Selected |
|--------|-------------|----------|
| Capa + todos itens com mídia + QR | Completo | ✓ |
| Só dano/regular/ruim | Enxuto | |
| + Protocolo de Chegada | Mais longo | |

**User's choice:** Capa + todos itens com mídia + QR

| Option | Description | Selected |
|--------|-------------|----------|
| Relatório Fotográfico + disclaimer CREA | Full | |
| Só título sem disclaimer | Mínimo | |
| Other: disclaimer discreto sem destaque | | ✓ |

**User's choice:** Relatório Fotográfico + disclaimer bem discreto internamente sem destaque

| Option | Description | Selected |
|--------|-------------|----------|
| QR só na capa | | |
| QR capa + tela admin | | |
| Other: QR discreto na capa + destacado na última página | | ✓ |

**User's choice:** Na capa de forma discreta e na última página com mais destaque

---

## Finalizar e link público

| Option | Description | Selected |
|--------|-------------|----------|
| Só admin | | |
| Admin ou vistoriador | | ✓ |
| Só vistoriador dono | | |

**User's choice:** Admin ou vistoriador

| Option | Description | Selected |
|--------|-------------|----------|
| Gate rígido todos REVISADO | | ✓ |
| Pular sem mídia | | |
| Avisar mas forçar | | |

**User's choice:** Sim — gate rígido

| Option | Description | Selected |
|--------|-------------|----------|
| Sem expiração MVP | | ✓ |
| 30 dias | | |
| 7 dias | | |

**User's choice:** Sem expiração no MVP

| Option | Description | Selected |
|--------|-------------|----------|
| Só leitura fotos+desc | Galeria pública | |
| Contestar desabilitado | Stub UI | |
| Leitura mínima capa + PDF download | | ✓ |

**User's choice:** Leitura mínima (só capa + PDF download)

| Option | Description | Selected |
|--------|-------------|----------|
| Regenerar sobrescreve | | |
| Other: sobrescreve + log/histórico | | ✓ |

**User's choice:** Regenerar sobrescreve o PDF mas mantém log/histórico do que foi modificado

| Option | Description | Selected |
|--------|-------------|----------|
| Omitir itens sem mídia | | ✓ |
| Listar com nota sem mídia | | |

**User's choice:** Não — omitir itens sem mídia

| Option | Description | Selected |
|--------|-------------|----------|
| Re-revisão + regerar manual pós-finalize | | ✓ |
| Edição livre + regerar sob demanda | | |
| Bloquear edição após GERADO | | |

**User's choice:** Exigir re-revisão do item + regerar PDF manualmente

---

## Histórico de regeneração do PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Quem/quando/motivo + versões | | ✓ |
| Diff de descrições | | |
| Só contador + data | | |

**User's choice:** Quem / quando / motivo + contagem de versões

| Option | Description | Selected |
|--------|-------------|----------|
| Só admin | | |
| Admin e vistoriador | | ✓ |
| Só log técnico | | |

**User's choice:** Admin e vistoriador

---

## Claude's Discretion

- Acesso ao link público (sessão encerrou sem resposta): default **qualquer um com o token URL**, sem senha/CPF
- Detalhes de schema de auditoria além dos campos mínimos
- Copy tipográfico fino do disclaimer e QR

## Deferred Ideas

- WhatsApp send, contestação/confirmação cliente — Phase 4
- Galeria pública completa por item — possível na Phase 4
- Expiração/revogação de token — pós-MVP
