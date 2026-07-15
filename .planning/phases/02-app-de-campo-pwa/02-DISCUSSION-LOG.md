# Phase 2: App de Campo (PWA) — Núcleo Offline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 02-app-de-campo-pwa
**Areas discussed:** PWA Install & Brand, Offline Data Strategy, Capture UX (Foto/Áudio), Sync & Status Indicators

---

## PWA Install & Brand

| Option | Description | Selected |
|--------|-------------|----------|
| Nome do app | Nome exibido na tela inicial do dispositivo | ✓ "Facilita Vistorias" |
| Ícone | Design do ícone do app | ✓ Azul com logo da marca |
| Theme color | Cor do tema PWA | ✓ #00AEEF (primary) |
| Splash screen | Tela de abertura | ✓ Design simples e limpo |

**User's choice:** Definiu diretrizes completas para todas as configurações do manifest PWA.
**Notes:** Identidade visual consistente com o site institucional (facilitavistorias.com.br). Theme color alinhado ao token primary do Design System.

---

## Offline Data Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Escopo de dados | Quais dados pré-carregar antes de sair a campo | ✓ Todas as vistorias do dia atribuídas ao vistoriador logado |
| Granularidade | Nível de detalhe dos dados offline | ✓ Dados completos: imóveis, ambientes, pessoas |
| Armazenamento | Onde persistir os dados offline | ✓ 100% no IndexedDB (via biblioteca `idb`) |

**User's choice:** Pré-carregamento completo das vistorias do dia com todos os dados relacionados — o vistoriador não depende de internet para nada durante a execução.
**Notes:** Abordagem ambiciosa mas viável para o volume típico de 2-5 vistorias/dia por vistoriador.

---

## Capture UX (Foto e Áudio)

| Option | Description | Selected |
|--------|-------------|----------|
| Fonte de foto | Como capturar imagens | ✓ Câmera nativa + galeria do dispositivo |
| Múltiplas fotos | Quantas fotos por item | ✓ Múltiplas fotos por item |
| Preview de foto | Revisão antes de confirmar | ✓ Preview com opção de apagar/refazer |
| Gravação de áudio | Interface de gravação | ✓ Botão estilo WhatsApp (tap para iniciar/parar) |
| Feedback de áudio | Indicadores durante gravação | ✓ Contador de segundos visível |
| Revisão de áudio | Conferir antes de enviar | ✓ Preview do áudio + opção de excluir/regravar |

**User's choice:** UX de captura inspirada em padrões familiares (câmera nativa, gravador estilo WhatsApp) para reduzir curva de aprendizado do vistoriador.
**Notes:** O botão estilo WhatsApp (tap toggle, sem hold) é importante — hold-to-record causa fadiga em narrações longas.

---

## Sync & Status Indicators

| Option | Description | Selected |
|--------|-------------|----------|
| Gatilho de sync | Quando sincronizar | ✓ Automático em background ao reconectar |
| Indicador visual | Como mostrar status de sync | ✓ Ícone de nuvem por item |
| Cor pendente | Status "salvo localmente" | ✓ Laranja/Slate |
| Cor sincronizado | Status "enviado ao servidor" | ✓ Verde/Azul |

**User's choice:** Abordagem transparente — o vistoriador não precisa gerenciar sincronização manualmente. O ícone de nuvem dá visibilidade sem interromper o fluxo de trabalho.
**Notes:** O sync em background é tecnicamente viável via Background Sync API ou polling no service worker ao detectar reconexão.

---

## Claude's Discretion

- Estratégia de retry e tratamento de falhas de sync (exponential backoff, fila de retry)
- Estrutura exata das stores do IndexedDB (schema das tabelas locais)
- Escolha entre `<input capture>` vs MediaDevices API para câmera
- Implementação específica do service worker e estratégia de cache
- Tratamento de conflitos (ex: item editado no servidor enquanto estava offline)
- Política de limpeza do IndexedDB após sync bem-sucedido (manter cache vs liberar espaço)
- Abordagem para atualização do PWA (prompt de update vs auto-update)

## Deferred Ideas

- Comparação automática entrada x saída — Fase 5 (Contestação)
- Assinatura digital no app de campo — Backlog
- Timeline com geolocalização do vistoriador — Backlog
- Modo de revisão da IA no app de campo — Fase 3 (Pipeline de IA)
