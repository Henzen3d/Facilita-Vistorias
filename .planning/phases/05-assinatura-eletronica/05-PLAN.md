# Phase 5: Assinatura Eletrônica Nativa — Plano de Execução

**Created:** 2026-07-17  
**Status:** Executado (code 2026-07-17) — migrate + UAT pendentes  
**Depends on:** Phase 4 concluída (token JWT, status CONFIRMADO, página pública)

---

## Objetivo

Implementar assinatura eletrônica nativa (sem serviços terceiros) com:
- Canvas de desenho a dedo (Signature Pad)
- Log de auditoria com valor jurídico (IP, User-Agent, Data/Hora, CPF hasheado)
- Hash SHA-256 de integridade do documento
- Hard lock pós-assinatura
- PDF re-gerado com página de auditoria e assinatura estampada

---

## Wave 1 — Schema, API e Validações

### Tarefas

**1.1 — Schema Prisma (novos campos em `Relatorio`)**
- Adicionar: `assinadoEm`, `assinaturaImagem`, `assinaturaHash`, `assinaturaIp`, `assinaturaDevice`, `assinaturaNome`, `assinaturaCpfHash`
- Adicionar valor `ASSINADA` ao enum `StatusRelatorio`
- Rodar `prisma migrate dev --name phase5_assinatura`

**1.2 — API de Assinatura**
- `POST /api/public/relatorio/[token]/assinar`
- Payload: `{ nomeCompleto, cpf, assinaturaBase64 }`
- Validações:
  - Token JWT válido e não expirado
  - Status do relatório = `CONFIRMADO` (sem contestações pendentes)
  - CPF válido (algoritmo módulo 11)
  - assinaturaBase64 não vazia e formato PNG válido
- Ações do servidor:
  1. Gerar hash SHA-256: `SHA256(relatórioId + token + dataISO + nomeCompleto)`
  2. Hashear CPF com bcrypt (custo 10)
  3. Capturar IP real (header `x-forwarded-for` ou `req.ip`)
  4. Salvar todos os campos na tabela `Relatorio`
  5. Mudar status para `ASSINADA`
  6. Disparar job de re-geração do PDF (fila BullMQ, worker existente)

**1.3 — Hard Lock**
- Estender o middleware de edição para bloquear status `ASSINADA` junto com `FINALIZADA/CONCLUIDA`
- Retornar HTTP 423 (Locked) com mensagem clara

---

## Wave 2 — Página Pública de Assinatura

### Tarefas

**2.1 — Nova rota `/public/r/[token]/assinar`**
- Exibir apenas se status `CONFIRMADO` (sem contestações PENDENTE/EM_ANALISE)
- Caso contrário, redirecionar para `/public/r/[token]` com aviso

**2.2 — Componente `SignaturePad`**
- Canvas HTML5 nativo (sem biblioteca externa)
- Suporte a toque (touch events) e mouse
- Botões: "Limpar" e "Confirmar Assinatura"
- Preview da assinatura antes de submeter
- Exportar como PNG Base64 no submit

**2.3 — Formulário de Dados do Assinante**
- Campo: Nome Completo (pré-preenchido se disponível no `nomeQuemConfirmou`)
- Campo: CPF (máscara `000.000.000-00`, validação em tempo real)
- Checkbox: "Declaro que li e concordo com o conteúdo deste documento"
- Botão "Assinar" ativado apenas quando todos os campos são válidos e assinatura foi desenhada

**2.4 — UX de Confirmação**
- Loading state durante envio à API
- Tela de sucesso: "Documento assinado com sucesso" + data/hora + hash truncado
- Botão para baixar o PDF atualizado

---

## Wave 3 — PDF com Página de Auditoria

### Tarefas

**3.1 — Nova página no template Puppeteer**
- Adicionar seção final ao HTML do PDF: "Registro de Assinatura Eletrônica"
- Layout da página de auditoria:
  ```
  ┌──────────────────────────────────────────┐
  │  ASSINATURA ELETRÔNICA                   │
  │                                          │
  │  [Imagem da assinatura desenhada]        │
  │                                          │
  │  Nome:     OSMAR GONCALVES FILHO         │
  │  Data:     17/07/2026 às 14:32:17 UTC-3  │
  │  IP:       177.20.xx.xxx                 │
  │  Dispositivo: Chrome 126 / Android 14    │
  │  Hash SHA-256:                           │
  │  a3f9d2e1b8c4...7f2e0a1b                 │
  │                                          │
  │  [QR Code] → /public/r/[token]/audit     │
  │                                          │
  │  Documento com validade jurídica         │
  │  MP nº 2.200-2/2001 e Lei nº 14.063/2020 │
  └──────────────────────────────────────────┘
  ```

**3.2 — Re-geração do PDF no Worker**
- Novo job type: `REGENERATE_PDF_AFTER_SIGN`
- Reusar o gerador Puppeteer existente com flag `includeSignaturePage: true`
- Sobrescrever o arquivo PDF no R2/MinIO (mesma chave/path)
- Atualizar `pdfUrl` e `pdfGeradoEm` no banco após conclusão

**3.3 — Rota pública de auditoria `/public/r/[token]/audit`**
- Exibir os metadados da assinatura de forma legível
- Hash SHA-256 exibido por completo para verificação manual
- Não exibe CPF (apenas os últimos 3 dígitos para confirmação)

---

## Schema SQL Resultante

```sql
ALTER TABLE "Relatorio" 
  ADD COLUMN "assinado_em"        TIMESTAMPTZ,
  ADD COLUMN "assinatura_imagem"  TEXT,        -- Base64 PNG
  ADD COLUMN "assinatura_hash"    VARCHAR(64), -- SHA-256 hex
  ADD COLUMN "assinatura_ip"      VARCHAR(45), -- IPv4 ou IPv6
  ADD COLUMN "assinatura_device"  VARCHAR(255),
  ADD COLUMN "assinatura_nome"    VARCHAR(255),
  ADD COLUMN "assinatura_cpf_hash" VARCHAR(60); -- bcrypt hash

ALTER TYPE "StatusRelatorio" ADD VALUE 'ASSINADA';
```

---

## Critérios de Aceite (UAT)

| # | Cenário | Esperado |
|---|---------|----------|
| 1 | Abrir link público com status CONFIRMADO | Botão "Assinar Documento" visível |
| 2 | Abrir link com contestação PENDENTE | Botão "Assinar" não aparece + aviso |
| 3 | Desenhar assinatura + preencher nome + CPF inválido | Botão "Assinar" bloqueado + erro no campo CPF |
| 4 | Submeter assinatura válida | Tela de sucesso + hash exibido |
| 5 | Tentar editar vistoria após ASSINADA no admin | HTTP 423 + mensagem bloqueada |
| 6 | Baixar PDF após assinatura | PDF contém página de auditoria com assinatura |
| 7 | Acessar `/public/r/[token]/audit` | Exibe metadados sem CPF completo |

---

## Dependências Externas

- Nenhuma biblioteca nova obrigatória (Canvas nativo)
- Opcional: `bcryptjs` já disponível no projeto para hashear CPF

---

## Estimativa

| Wave | Complexidade | Estimativa |
|------|-------------|------------|
| Wave 1 (Schema + API) | Média | ~4h |
| Wave 2 (UI Assinatura) | Média | ~6h |
| Wave 3 (PDF + Auditoria) | Alta | ~8h |
| **Total** | | **~18h** |
