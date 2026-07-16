# Plano de Redesign — Facilita Vistorias App

> **Arquivo:** `plan-new-redesing.md` (raiz do projeto)  
> **Data:** 2026-07-16  
> **Objetivo:** melhorar o design do sistema de forma incremental e controlada, usando três skills de design para agentes de IA, sem abandonar a identidade já documentada em `DESIGN.md`.  
> **Fontes das skills:** `Referencias/Skills Desing.md`

---

## 1. Contexto do projeto (o que já temos)

O app **Facilita Vistorias** é produto operacional (campo + admin + relatório público), não landing page de marketing.

| Superfície | Quem usa | Prioridade de design |
|---|---|---|
| **App de campo (PWA)** `/field/*` | Vistoriador no celular, muitas vezes offline | Máxima — velocidade, touch, clareza, feedback de sync |
| **Admin** `/admin/*` | Gestor — revisão IA, agenda, cadastros | Alta — densidade, hierarquia, estados de workflow |
| **Relatório público** `/public/r/*` | Cliente (locatário/locador) | Alta marca — confiança, legibilidade, CTA WhatsApp |
| **Login / shell** | Todos | Média — primeiro contato com a marca |

**Já existe:**

- `DESIGN.md` sólido (tokens reais do site: `#00AEEF`, `#1A2B3C`, `#FFB703`, Inter + Instrument Serif, Material Symbols, anti-roxo).
- Mockups em `Referencias/Design/` e protótipo Lovable (`Referencias/Design/Lovable/`).
- Shell de campo (`PhoneShell`, bottom nav, `TopBar`).
- Componentes de relatório (`RelatorioFotograficoView`, editor de descrição).

**Ainda frágil (hipótese de redesenho):**

- Pasta `src/components/ui/` vazia / pouco reutilizada — risco de estilos ad hoc por página.
- Telas de campo e admin cresceram por fase funcional (offline, IA, PDF) com menos passada de “polish” visual.
- Motion pouco intencional (ou genérico), sem auditoria de easing/duração/acessibilidade.
- Risco de “AI slop” em iterações futuras (gradientes roxos, cards aninhados, tipografia genérica) se o agente não for guiado.

**Regra de ouro deste plano:** as skills **guiam o agente**; a **fonte da verdade da marca** continua sendo `DESIGN.md` + `tailwind.config.ts`. Skill nenhuma pode reescrever a paleta Facilita “do zero”.

---

## 2. Pesquisa das três skills

### 2.1 Emil Kowalski — Skills for Design Engineers

| | |
|---|---|
| **Repos** | [github.com/emilkowalski/skills](https://github.com/emilkowalski/skills) · [emilkowal.ski/skill](https://emilkowal.ski/skill) |
| **Install** | `npx skills@latest add emilkowalski/skills` |
| **Foco** | Motion + decisões de micro-UI de “design engineer” (Vercel/Linear) |
| **Licença** | MIT |

**O que entrega:**

| Skill | Função |
|---|---|
| `emil-design-eng` | Skill principal: animações + conselhos de UI (easing, sombra vs borda, etc.) |
| `review-animations` | Revisão estrita de animações existentes |
| `improve-animations` | Audita o codebase inteiro em 8 categorias e gera **planos executáveis** em `plans/` (não mexe no código sozinho) |
| `find-animation-opportunities` | Onde motion ajuda de verdade — e o que **não** animar |
| `animation-vocabulary` | Vocabulário para pedir motion certo ao agente |
| `apple-design` | Princípios Apple (WWDC) traduzidos para web |

**Por que importa:** agentes erram o “gosto” fino — `ease-in` em enter, bounce datado, borda sólida em vez de sombra semi-transparente. Esses erros se acumulam e deixam o produto “quase bom”.

**Melhor uso no Facilita:**

- Feedback de **toque** (botões de capturar foto/áudio, aprovar item).
- Transições de **estado** (offline → sync → ok; item CAPTURADO → ANALISADO → REVISADO).
- Skeleton / loading do pipeline de IA e geração de PDF.
- Bottom nav e progress de ambiente/item.
- **Não** animar tudo: em campo, motion excessiva atrasa e cansa.

**Cuidado:** é complementar, não substituto de design system. Usar **depois** de hierarquia e tokens estarem estáveis.

---

### 2.2 Impeccable (Paul Bakaus)

| | |
|---|---|
| **Repos** | [github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable) · [impeccable.style](https://impeccable.style) |
| **Install** | `npx impeccable install` → no agente: `/impeccable init` |
| **Foco** | Vocabulário de design + anti-slop + workflow de produto |
| **Licença** | Apache 2.0 |

**O que entrega:**

1. **1 skill + ~23 comandos** com linguagem de designer:

| Comando | Uso típico |
|---|---|
| `/impeccable init` | Setup: `PRODUCT.md` + alinhamento com `DESIGN.md` |
| `/impeccable document` | Extrair/atualizar DESIGN a partir do código |
| `/impeccable critique` | Review de hierarquia, clareza, ressonância |
| `/impeccable audit` | a11y, performance, responsive |
| `/impeccable polish` | Passada final antes de ship |
| `/impeccable distill` / `quieter` / `bolder` | Ajustar “volume” visual |
| `/impeccable layout` / `typeset` / `colorize` | Layout, tipo, cor |
| `/impeccable animate` | Motion com propósito (depois: Emil) |
| `/impeccable harden` | Erros, overflow, edge cases (ótimo em formulários) |
| `/impeccable onboard` | Empty states, first-run |
| `/impeccable adapt` | Mobile/desktop |
| `/impeccable live` | Iterar no browser com variantes (beta) |

2. **Detector determinístico** (46 regras, sem LLM):  
   `npx impeccable detect src/` — bom para PR/CI.

3. **Modos brand vs product** — crítico para nós:  
   - **Product mode** → `/field`, `/admin`  
   - **Brand mode** → `/public/r/*`, marketing residual  

**Melhor uso no Facilita:**

- **Orquestrador principal** do redesign (audit → critique → layout/typeset → polish).
- Respeitar tokens já existentes (Impeccable é forte em “não inventar sistema novo”).
- Detector em CI para bloquear slop (gradiente roxo, side-stripe, bounce, touch target pequeno).
- `PRODUCT.md` com personas: vistoriador em obra, admin revisando IA, cliente lendo relatório no celular.

**Cuidado importante (Inter):**

Impeccable lista **Inter** entre fontes “overused” em anti-patterns genéricos. **No Facilita, Inter é marca oficial** (site institucional + `DESIGN.md`).  
→ Configurar waiver / `detector.ignoreValues` para Inter e documentar: *“Inter é brand font, não slop”*.  
→ Instrument Serif só na superfície pública (já definido no DESIGN.md).

---

### 2.3 Taste Skill (Leonxlnx)

| | |
|---|---|
| **Repos** | [github.com/Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) · [tasteskill.dev](https://www.tasteskill.dev/) |
| **Install** | `npx skills add Leonxlnx/taste-skill` (ou skill específica com `--skill`) |
| **Foco** | Framework anti-slop + variantes de estilo + image-to-code |
| **Licença** | MIT |

**Skills relevantes para nós:**

| Install name | Quando usar |
|---|---|
| `design-taste-frontend` (v2) | Default ao **criar** UI nova com mais “gosto” |
| `redesign-existing-projects` | **Audit-first** em código já existente (nossa situação) |
| `image-to-code` | Fechar o gap entre `Referencias/Design/*` e implementação |
| `imagegen-frontend-mobile` | Gerar comps de fluxos mobile se faltar referência |
| `minimalist-ui` | Admin denso, estilo “Linear/Notion” |
| `high-end-visual-design` (`soft-skill`) | Relatório público “premium/calmo” |
| `full-output-enforcement` | Se o agente entregar telas pela metade |

**Dials (taste-skill):**

| Dial | Sugestão Facilita |
|---|---|
| `DESIGN_VARIANCE` | **Baixo–médio (3–5)** no app de campo/admin — previsibilidade > experimentação |
| `MOTION_INTENSITY` | **Baixo (2–4)** em campo; médio no público |
| `VISUAL_DENSITY` | **Alto (7–8)** no admin; **médio (5)** no field; **baixo (3–4)** no relatório público |

**Melhor uso no Facilita:**

- Passada **redesign-skill** no início (auditoria visual do que já existe).
- **image-to-code** alinhando mocks (`Referencias/Design/`, Lovable) às rotas reais Next.js.
- Variantes de estilo **só** na superfície certa (minimalist admin / soft público) — não misturar brutalist no produto.

**Cuidado:** v2 é experimental e otimizada para “interfaces que não parecem template”. Em app de campo, “template previsível” **é feature** (velocidade). Preferir redesign-skill + minimalist no operacional; taste “criativo” só onde marca vende confiança (público).

---

## 3. Como as três se complementam (não competem)

```
┌─────────────────────────────────────────────────────────────┐
│  FONTE DA VERDADE                                           │
│  DESIGN.md + tailwind.config.ts + Referencias/Design/*      │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   ┌───────────┐     ┌─────────────┐    ┌──────────────┐
   │ Taste     │     │ Impeccable  │    │ Emil         │
   │ (direção  │     │ (sistema +  │    │ (motion +    │
   │  visual + │────▶│  comandos + │───▶│  micro-feel) │
   │  anti-slop│     │  detect CI) │    │              │
   │  + mocks) │     │             │    │              │
   └───────────┘     └─────────────┘    └──────────────┘
        ↑                   │
        │            PRODUCT.md (personas,
        │            anti-refs, brand/product)
        └───────────────────┘
```

| Camada | Skill líder | Entrega |
|---|---|---|
| **0. Identidade** | Humano + `DESIGN.md` | Tokens, anti-roxo, Inter oficial, estados bom/regular/dano |
| **1. Direção visual / mocks → código** | **Taste** (`redesign`, `image-to-code`) | Gap visual vs referência; menos “vibe genérica” |
| **2. Sistema + polish de produto** | **Impeccable** | Critique, layout, a11y, polish, detect em CI |
| **3. Motion fino** | **Emil** | Easing, duração, oportunidades, planos de animação |

**Ordem mental de qualquer tela:**  
`Taste (direção/audit) → Impeccable (estrutura/polish) → Emil (só motion que importa)`.

---

## 4. Melhores aplicações por superfície

### 4.1 App de campo (`/field`)

| Problema típico | Skill | Comando / skill | Resultado esperado |
|---|---|---|---|
| Telas “funcionam” mas parecem protótipo | Taste | `redesign-existing-projects` | Hierarquia, espaçamento, progress |
| Mock Lovable ≠ página Next | Taste | `image-to-code` + refs em `Referencias/Design/` | Paridade visual controlada |
| Checklist densa, labels fracos | Impeccable | `/impeccable layout` + `typeset` + `harden` | 16px+, touch ≥44px, labels |
| Nav inferior / estados ativos | Emil | `find-animation-opportunities` + press feedback | Active state + press sem atraso |
| Sync offline | Impeccable + Emil | `onboard` empty states + motion de status | Confiança no que está pendente |
| Captura foto/áudio | Impeccable | `adapt` + `audit` | Safe areas, one-hand, contraste ao sol |

**Dials Taste sugeridos (field):** variance 3 · motion 3 · density 5.

### 4.2 Admin (`/admin`)

| Problema típico | Skill | Ação |
|---|---|---|
| Tabelas/cards inconsistentes | Impeccable | `extract` componentes + `polish` |
| Revisão IA confusa | Impeccable | `critique` + `clarify` (copy) |
| Visual “dashboard genérico” | Taste | `minimalist-ui` (restrito) |
| Feedback ao aprovar/editar | Emil | micro-interações curtas (≤200ms) |

**Dials:** variance 3 · motion 2 · density 8.

### 4.3 Relatório público (`/public/r/[token]`)

| Problema típico | Skill | Ação |
|---|---|---|
| Parece app interno, não marca | Taste | `soft-skill` / direção “confiança + leveza” |
| Tipografia sem assinatura | Impeccable | `typeset` + Instrument Serif só no headline (DESIGN.md §3.2) |
| CTA WhatsApp | DESIGN.md + Impeccable | cor oficial `#25D366`, não primary ciano |
| PDF/print | Impeccable | `adapt` + `audit` print layout |
| Delight controlado | Emil | entrada suave da capa; QR sem bounce |

**Dials:** variance 5 · motion 4 · density 3.  
**Modo Impeccable:** brand (não product).

### 4.4 Onde **não** aplicar agressivamente

- Worker / APIs / Prisma — zero design skill.
- PDF Puppeteer: só layout de print + tokens; evitar animações.
- Fluxos de campo em obra com sol forte: priorizar contraste e tamanho, não “premium blur”.

---

## 5. Plano de execução em fases

> Redesign **incremental**. Não reescrever o app. Cada fase tem aceite humano no dispositivo real (celular do vistoriador).

### Fase 0 — Fundação (1 sessão)

**Objetivo:** instalar e amarrar as skills ao design system existente.

1. Instalar as três skills (projeto ou global do harness):

```bash
# Impeccable (recomendado: CLI nativo do projeto)
npx impeccable install

# Taste Skill (kit completo; depois usar skills específicas por tarefa)
npx skills add Leonxlnx/taste-skill

# Emil design-eng + animações
npx skills@latest add emilkowalski/skills
```

2. No agente: `/impeccable init`
   - Superfície default: **product**
   - Apontar `DESIGN.md` existente (não regenerar do zero se conflitar)
   - Criar `PRODUCT.md` com:
     - Personas (vistoriador, admin, cliente)
     - Anti-referências: roxo, glassmorphism, “AI purple gradient”, Inter “por acidente”, cards em cards
     - **Exceção documentada:** Inter é brand font
     - Tom: confiança + leveza; termos CREA proibidos

3. Configurar detector:

```bash
npx impeccable detect src/
# Waivers necessários:
# - overused-font Inter (brand)
# - qualquer regra que colida com tokens oficiais documentados
```

4. Decicionar ao `.gitignore` o bloco ephemeral do Impeccable (docs oficiais).

5. Opcional CI: job `npx impeccable detect src/ --json` em PRs de UI.

**Aceite Fase 0:** skills carregam no harness; `PRODUCT.md` commitado; detect roda; Inter waived com razão.

---

### Fase 1 — Auditoria (sem reescrever UI)

**Objetivo:** mapa honesto do gap visual.

| Passo | Ferramenta | Saída |
|---|---|---|
| 1.1 | Taste `redesign-existing-projects` em `src/app/field`, `admin`, `public` | Relatório de problemas por tela |
| 1.2 | `/impeccable critique` por superfície | Hierarquia, clareza, emoção |
| 1.3 | `/impeccable audit` | a11y, touch, contraste, responsive |
| 1.4 | `npx impeccable detect src/` | Lista determinística de slop |
| 1.5 | Emil `find-animation-opportunities` | Onde motion ajuda / onde proibir |
| 1.6 | Humano | Priorizar top 10 issues (impact × esforço) |

**Artefato:** `Referencias/Design/AUDIT-REDESIGN-YYYY-MM-DD.md` (checklist priorizado).

**Aceite:** lista priorizada acordada; nada de redesign amplo ainda.

---

### Fase 2 — Design system operacional (base reutilizável)

**Objetivo:** parar de estilizar tela a tela.

1. `/impeccable extract` → consolidar em `src/components/ui/`:
   - Button (primary / secondary / ghost / destructive / WhatsApp)
   - Card / ListRow (item de vistoria)
   - Badge de estado (`state-good|fair|bad|pending` do DESIGN.md)
   - Input + Label (regra a11y do DESIGN.md)
   - Progress (barra de ambientes/itens)
   - Toast / SyncPill
2. Alinhar tokens Tailwind com DESIGN.md (já em progresso no `globals.css`).
3. Documentar variantes no próprio DESIGN.md (seção “Componentes do app”).
4. Taste: **não** reinventar paleta; só coerência de spacing/type scale.

**Aceite:** 5+ componentes usados em ≥2 rotas; zero hex “solto” novo fora dos tokens.

---

### Fase 3 — Redesign por fatia vertical (ordem recomendada)

Ordem pensada em **valor + frequência de uso**:

| Sprint | Fatia | Skills | Notas |
|---|---|---|---|
| **3A** | Login field + home `/field` | Taste image-to-code (refs login) → Impeccable polish | Primeira impressão diária do vistoriador |
| **3B** | Fluxo de captura item (foto+áudio) | Impeccable harden/adapt → Emil press + status | Coração do produto; touch e feedback |
| **3C** | Ambientes / lista de itens / progress | Taste redesign + Impeccable layout | Hick’s Law: ≤7 ações primárias |
| **3D** | Revisão IA (field + admin) | Impeccable critique/clarify + minimalist | Clareza > beleza; bloquear “laudo” na UI |
| **3E** | Admin dashboard + lista vistorias | Impeccable distill + density alta | Dados densos, sem card-ception |
| **3F** | Relatório público capa + download | Taste soft + Impeccable brand mode + Emil sutil | Instrument Serif no headline; WhatsApp Phase 4 |
| **3G** | Sync + empty states + erros | Impeccable onboard/harden + Emil status | Confiança offline |

**Por sprint:**

1. Abrir ref visual (`Referencias/Design/*` ou Lovable).
2. Taste `image-to-code` **ou** redesign pontual (não greenfield).
3. Impeccable `layout` → `typeset` → `harden` → `polish`.
4. Emil só se houver feedback de estado/toque.
5. `npx impeccable detect` no diff.
6. Teste real no celular + 1 usuário (você ou vistoriador).

**Aceite por fatia:** paridade com ref **ou** justificativa escrita; touch targets OK; tokens OK; detect sem novos HIGH.

---

### Fase 4 — Motion com propósito (depois do visual estável)

1. Emil `improve-animations` (audit 8 categorias) → planos em `plans/`.
2. Executar só planos priorizados:
   - Press em botões primários
   - Transição de badge de status de item
   - Indicador de sync
   - Skeleton de “IA processando”
3. `review-animations` no final.
4. Respeitar `prefers-reduced-motion`.

**Aceite:** nenhuma animação > 300ms em fluxo de captura; reduced-motion desliga non-essential.

---

### Fase 5 — Phase 4 produto (Envio e Contestação) **já com skills**

Quando o roadmap GSD entrar em Phase 4:

1. `/impeccable shape` + GSD `ui-phase` / `discuss-phase 4` (não substituir GSD).
2. Taste `imagegen-frontend-mobile` se precisar de comps de contestação.
3. Brand mode no fluxo do cliente; product mode no envio admin.
4. Emil: micro-feedback de “link copiado” / “abrir WhatsApp”.

Assim o redesign **não compete** com o MVP funcional — vira **padrão de qualidade** da próxima fase.

---

### Fase 6 — Ritual contínuo (manutenção)

| Quando | O quê |
|---|---|
| Toda PR de UI | `npx impeccable detect` (CI opcional) |
| Toda tela nova | Impeccable polish + tokens; Taste só se “parecer genérico” |
| Mensal | Emil `improve-animations quick` |
| Antes de demo/cliente | `/impeccable polish` na superfície pública |

---

## 6. Matriz rápida “quando usar o quê”

| Situação | Use |
|---|---|
| “Essa tela parece IA genérica” | Taste redesign / taste-skill |
| “Preciso igualar o mock da pasta Referencias” | Taste `image-to-code` |
| “Hierarquia/espaçamento/a11y ruins” | Impeccable critique + layout + audit |
| “Vou shipar amanhã” | Impeccable polish + detect |
| “Botão não dá feedback / easing errado” | Emil review / improve-animations |
| “Onde animar?” | Emil find-animation-opportunities |
| “Admin parece bagunçado” | Impeccable distill + Taste minimalist |
| “Público precisa parecer Facilita” | Taste soft + Impeccable brand + DESIGN.md §3.2 |
| “Agente inventou roxo / gradient” | Impeccable detect + DESIGN.md anti-roxo |

---

## 7. Guardrails (não negociáveis)

1. **Não** regenerar paleta “bonita” diferente de `DESIGN.md`.
2. **Não** banir Inter no detector sem waiver — é brand.
3. **Não** Instrument Serif no app de campo/admin.
4. **Não** roxo / purple gradients (auditoria Maestro + DESIGN.md).
5. Body de campo **≥ 16px**; touch **≥ 44px**.
6. Estados de item só com tokens `state-*`.
7. WhatsApp sempre `#25D366` em CTA de envio.
8. Termos proibidos na UI de descrição: “laudo”, “laudo técnico”.
9. Offline-first: UI de sync não pode depender de motion pesada ou imagens enormes.
10. Skills **não** alteram regras de negócio (finalize gate, roles, CREA).

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Skills brigam entre si (3 vozes) | Ordem fixa: Taste → Impeccable → Emil; uma skill “líder” por PR |
| Redesign atrasa Phase 4 / UAT | Fases 0–1 paralelas à UAT; 3A–3C só após smoke funcional |
| Taste v2 “criativo demais” no field | Dials baixos + redesign-skill; brutalist off |
| Impeccable quer trocar Inter | Waiver + nota em PRODUCT.md |
| Emil anima demais no sol/campo | Lista “não animar” na auditoria; reduced-motion |
| Refator visual quebra offline | Testar PWA + sync após cada fatia 3B/3C/3G |

---

## 9. Definição de sucesso (90 dias)

- [ ] `PRODUCT.md` + detector + skills instaladas
- [ ] Componentes UI reutilizáveis cobrindo botões, badges, list rows, progress
- [ ] Field: home + captura + progress visualmente alinhados às refs
- [ ] Admin: revisão IA legível em 1 olhada (estado do item óbvio)
- [ ] Público: capa com assinatura tipográfica Facilita + download claro
- [ ] CI ou checklist local com `impeccable detect` limpo (exceto waivers documentados)
- [ ] Motion só em hotspots aprovados; zero bounce/elastic
- [ ] Nenhum hex/gradient fora do sistema em telas redesenhadas

---

## 10. Primeiros comandos práticos (checklist de kickoff)

```text
[ ] 1. npx impeccable install
[ ] 2. /impeccable init   (product mode + apontar DESIGN.md)
[ ] 3. Criar PRODUCT.md (personas + anti-refs + Inter brand exception)
[ ] 4. npx skills add Leonxlnx/taste-skill
[ ] 5. npx skills@latest add emilkowalski/skills
[ ] 6. npx impeccable detect src/  → registrar baseline
[ ] 7. Rodar redesign-skill / critique só em /field (piloto)
[ ] 8. Escolher top 5 issues e abrir sprint 3A
```

---

## 11. Relação com GSD / roadmap atual

| Trabalho GSD | Design |
|---|---|
| UAT Phase 3 | Priorizar bugs funcionais; design só se bloquear usabilidade |
| Phase 4 Envio e Contestação | Entrar **já** com Impeccable shape + Taste refs (Fase 5 deste plano) |
| `/gsd:ui-phase 4` | Complementar com Impeccable (não substituir) |
| Este arquivo | Plano **paralelo** de qualidade visual — não substitui ROADMAP.md |

---

## 12. Resumo executivo

| Skill | Papel no Facilita | Quando |
|---|---|---|
| **Taste Skill** | Direção visual, anti-slop, mock → código, redesign audit | Início de fatia / tela genérica |
| **Impeccable** | Sistema, comandos diários, a11y, polish, CI detect | Orquestrador principal do dia a dia |
| **Emil Kowalski** | Motion e micro-feel profissional | Depois do visual estável |

**Não é um “big bang redesign”.** É um pipeline:  
**auditar → extrair sistema → redesenhar fatias → animar com critério → ritualizar.**

A identidade Facilita (ciano, secondary navy, accent âmbar, Inter, soft/blob no cliente, operacional no campo) permanece. As skills só elevam a execução e impedem regressão para UI genérica de IA.

---

## 13. Links rápidos

| Skill | Site | GitHub |
|---|---|---|
| Emil | https://emilkowal.ski/skill | https://github.com/emilkowalski/skills |
| Impeccable | https://impeccable.style/ | https://github.com/pbakaus/impeccable |
| Taste | https://www.tasteskill.dev/ | https://github.com/Leonxlnx/taste-skill |

Referência local: `Referencias/Skills Desing.md`  
Design system: `DESIGN.md`  
Mocks: `Referencias/Design/`
