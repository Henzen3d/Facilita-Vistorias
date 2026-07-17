# Phase 5: Assinatura Eletrônica Nativa — Context

**Gathered:** 2026-07-17  
**Status:** Ready for planning  
**Depends on:** Phase 4 (página pública `/public/r/[token]`, confirmação de recebimento, token JWT)

## Background

A Fase 4 entregou o fluxo de envio e contestação com "confirmação de recebimento" (nome + timestamp), mas sem validade jurídica formal. O cliente precisa que o documento tenha peso legal para ser usado em disputas judiciais relacionadas à Lei do Inquilinato (Lei nº 8.245/91).

A decisão estratégica foi **não usar serviços terceiros** (DocuSign, Clicksign, ZapSign) para evitar custo por assinatura e manter a experiência 100% dentro do nosso app. Em vez disso, implementamos uma **assinatura eletrônica nativa com log de auditoria e hash de integridade**, amparada pela MP nº 2.200-2/2001 e Lei nº 14.063/2020.

## Phase Boundary

1. **Signature Pad** — canvas de desenho a dedo na tela do celular (página pública `/public/r/[token]/assinar`)
2. **Coleta de Metadados de Auditoria** — IP, User-Agent, Data/Hora UTC, Nome, CPF
3. **Hash SHA-256 de Integridade** — gerado a partir dos dados consolidados do relatório no momento da assinatura; qualquer alteração posterior invalida o hash
4. **Hard Lock** — após assinatura, vistoria muda para status `ASSINADA` e fica permanentemente bloqueada para edição (tanto no admin quanto no field)
5. **PDF Final com Selo de Auditoria** — última página do PDF contém: imagem da assinatura, quadro de auditoria (hash, IP, data, dispositivo, CPF), QR code de verificação

**Out of scope:** ICP-Brasil, e-mail transacional automático, múltiplas assinaturas simultâneas (multi-parte), notificação push, configuração de prazo de assinatura na UI.

## Decisions

| ID | Decision |
|----|----------|
| D-01 | Assinatura é coletada na rota pública `/public/r/[token]/assinar` — sem login, acesso por token JWT válido |
| D-02 | Signature Pad usa Canvas nativo do browser (sem biblioteca pesada) — imagem exportada como PNG Base64 |
| D-03 | Metadados obrigatórios: Nome Completo (pré-preenchido se já confirmou) + CPF (validado por dígito verificador módulo 11) |
| D-04 | Hash SHA-256 gerado no servidor a partir de: `relatórioId + token + conteúdoJSON + timestamp` — nunca no cliente |
| D-05 | Hard lock: status `ASSINADA` bloqueia toda edição (fotos, descrições, medidores, cômodos) — irreversível sem intervenção direta no banco |
| D-06 | PDF final é re-gerado após assinatura com a última página de auditoria; arquivo substitui o PDF anterior no storage (R2/MinIO) |
| D-07 | Um único assinante MVP (inquilino/locatário) — fase futura pode adicionar locador e testemunhas |
| D-08 | CPF é armazenado com hash bcrypt no banco (não em plain text) para conformidade LGPD |
| D-09 | Página `/public/r/[token]` exibe botão "Assinar Documento" apenas se status for `CONFIRMADO` e não houver contestações `PENDENTE` ou `EM_ANALISE` |

## Success Criteria

1. Inquilino acessa o link no celular e consegue desenhar a assinatura com o dedo e confirmar com nome + CPF
2. Sistema gera hash SHA-256 no servidor e grava log de auditoria completo no banco
3. PDF final é re-gerado contendo a imagem da assinatura e o quadro de auditoria na última página
4. Status do relatório muda para `ASSINADA` e qualquer tentativa de edição no admin/field é bloqueada
5. QR code de verificação no PDF aponta para rota pública que exibe o log de auditoria da assinatura

## Existing Assets

- Rota `/public/r/[token]` com autenticação por token JWT (Phase 4)
- Status `CONFIRMADO` no modelo `Relatorio` (Phase 4)
- Soft lock por status `FINALIZADA/CONCLUIDA` no field (Phase 3.2)
- Gerador de PDF Puppeteer com layout extensível (Phase 3)
- Storage R2/MinIO para substituição do arquivo PDF (Phase 3)
- Hash SHA-256 do token já gerado no modelo `Relatorio` (Phase 3)

## Schema Changes Needed

```prisma
model Relatorio {
  // campos existentes...
  assinadoEm       DateTime?
  assinaturaImagem String?   // Base64 PNG da assinatura desenhada
  assinaturaHash   String?   // SHA-256 de integridade do documento
  assinaturaIp     String?
  assinaturaDevice String?   // User-Agent resumido
  assinaturaNome   String?
  assinaturaCpfHash String?  // CPF em hash bcrypt (LGPD)
}
```
