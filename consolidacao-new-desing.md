# Consolidação: Correções + Novas Funcionalidades + Design
> **Arquivo:** `consolidacao-new-desing.md` (raiz do projeto)
> **Criado:** 2026-07-16
> **Objetivo:** Corrigir bugs críticos identificados, adicionar funcionalidades ausentes e melhorar o design com base nas referências do `studio-google`.
> **Atualizar este arquivo** conforme cada tarefa for concluída. Se o trabalho for interrompido, retomar exatamente de onde parou.

---

## STATUS GLOBAL
| Área | Status |
|------|--------|
| Bug 1 — Progresso travado em 0% | ✅ Concluído |
| Bug 2 — Cômodo cadastrado não funciona | ✅ Concluído |
| Bug 3 — Adicionar novos cômodos durante vistoria | ✅ Concluído |
| Feat 4 — Criar vistoria do zero (campo) | ✅ Concluído |
| Design 5 — Melhorias visuais baseadas em studio-google | ⬜ Pendente |

---

## DIAGNÓSTICO TÉCNICO

### Bug 1 — Progresso da vistoria travado em 0%

**Arquivo afetado:** `src/app/field/vistorias/[id]/ambientes/page.tsx`

**Causa raiz identificada:**
O progresso é calculado nas linhas 112–116:
```ts
const itemsDone = items.filter(i => i.status !== "PENDENTE");
const totalDone = itemsDone.length;
const totalItems = items.length;
const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
```

O problema é que:
1. Quando o vistoriador marca itens do **Protocolo de Chegada** (checkboxes booleanos), isso NÃO atualiza nenhum `LocalItem` no IDB — são campos separados na tabela `checklistChegada`.
2. Os `items` só existem se a vistoria foi baixada do admin com itens cadastrados. Se o admin não cadastrou itens nos ambientes, `totalItems = 0` → `pct = 0%`.
3. O checklist é salvo corretamente mas não aparece no progresso global.

**Solução:**
- Calcular progresso do checklist separadamente (quantos dos 10 campos booleanos estão `true`).
- Exibir barra de progresso separada para "Protocolo de Chegada" (X/10 ítens).
- Quando todos os campos do checklist estiverem marcados, exibir badge "Protocolo Concluído ✓".
- Progresso geral = média ponderada: checklist (30%) + ambientes com itens (70%).

---

### Bug 2 — Cômodo cadastrado abre página mas não consegue fazer nada

**Arquivo afetado:** `src/app/field/vistorias/[id]/ambientes/[ambienteId]/page.tsx`

**Causa raiz identificada:**
1. Quando não há `items` (array vazio porque o admin não cadastrou itens para esse ambiente), a página mostra lista vazia sem nenhum CTA.
2. Falta botão de "Adicionar Item" visível quando a lista está vazia.
3. A mensagem de empty state não foi implementada.

**Solução:**
- Adicionar empty state com CTA "Adicionar Item" quando `items.length === 0`.
- Adicionar botão "+ Adicionar Item" fixo na parte inferior da página (além do link "Item Custom" no header).
- Confirmar que a navegação para `/itens/${item.id}` funciona com os IDs corretos do IDB.

---

### Bug 3 — Não consegue adicionar novos cômodos durante a vistoria

**Arquivo afetado:** `src/app/field/vistorias/[id]/ambientes/page.tsx`

**Causa raiz identificada:**
A página de cômodos NÃO tem botão de "Adicionar Cômodo". O protótipo de referência (`studio-google/RoomOverviewScreen.tsx`) tem o modal implementado mas não foi portado para o Next.js.

**Solução:**
- Adicionar botão "+ Adicionar Cômodo" na página.
- Implementar modal de criação de cômodo (baseado na referência): nome + tipo de ícone.
- Ao confirmar, salvar o novo `LocalAmbiente` no IDB com ID temporário (`amb-local-${Date.now()}`).
- Adicionar na `mutation_queue` para sincronizar com o servidor.
- Novo cômodo aparece imediatamente na lista (offline-first).

---

### Feat 4 — Criar vistoria do zero pelo vistoriador

**Rotas afetadas:** `src/app/field/page.tsx` + nova rota `src/app/field/vistorias/nova/page.tsx`

**Situação atual:**
O dashboard só mostra vistorias baixadas do servidor. Não há como criar uma vistoria sem ela estar cadastrada no admin primeiro.

**Solução:**
- Adicionar botão "Nova Vistoria" no dashboard, ao lado do botão de sincronizar.
- Criar página `/field/vistorias/nova/page.tsx` com formulário completo.
- Ao salvar: cria `LocalVistoria` com ID temporário, status `EM_ANDAMENTO`, salva no IDB e redireciona.
- Adicionar na `mutation_queue` com action `CREATE_VISTORIA_LOCAL`.

---

## PLANO DE EXECUÇÃO — PASSO A PASSO

### ETAPA 1 — Corrigir Bug 1: Progresso travado em 0%
**Arquivo:** `src/app/field/vistorias/[id]/ambientes/page.tsx`

- [ ] 1.1 — Calcular progresso separado do checklist de chegada (10 campos booleanos)
  - Criar lista `checklistFields` com os 10 campos
  - Calcular `checklistDone` = quantidade de `true`
  - Calcular `checklistPct` = `Math.round((checklistDone / 10) * 100)`
- [ ] 1.2 — Atualizar o card de progresso principal
  - Exibir duas métricas: "Protocolo de Chegada" (checklistPct%) e "Ambientes" (pct%)
  - Ou calcular progresso unificado: `(checklistPct * 0.3) + (pct * 0.7)`
- [ ] 1.3 — Adicionar feedback visual no protocolo de chegada
  - Exibir contagem "X/10 concluídos" ao lado do título "Protocolo de Chegada"
  - Quando `checklistDone === 10`, mostrar badge "✓ Protocolo Concluído" verde
- [ ] 1.4 — Testar: marcar todos os checkboxes e ver o progresso subir

---

### ETAPA 2 — Corrigir Bug 2: Página de cômodo não funcional
**Arquivo:** `src/app/field/vistorias/[id]/ambientes/[ambienteId]/page.tsx`

- [ ] 2.1 — Adicionar empty state quando `items.length === 0`
  - Ícone grande + texto "Nenhum item cadastrado para este cômodo"
  - Subtexto: "Adicione itens para iniciar a vistoria deste ambiente"
  - Botão "+ Adicionar Primeiro Item" em destaque
- [ ] 2.2 — Verificar navegação do botão "Capturar"
  - Confirmar que `item.id` e `ambienteId` batem com os dados do IDB
  - Verificar se a rota `itens/[itemId]` existe e carrega corretamente
- [ ] 2.3 — Adicionar botão flutuante "+ Adicionar Item" no rodapé
  - Estilo: botão primário grande, fixo na parte de baixo
  - Link para `/itens/novo` (criar rota se não existir) ou modal inline

---

### ETAPA 3 — Implementar adição de cômodos durante vistoria
**Arquivo:** `src/app/field/vistorias/[id]/ambientes/page.tsx`

- [ ] 3.1 — Adicionar estados `showAddModal`, `newRoomName`, `newRoomIcon`
- [ ] 3.2 — Criar função `handleAddAmbiente`:
  - Criar `LocalAmbiente` com `id = "amb-local-" + Date.now()`
  - Salvar no IDB: `db.put("ambientes", novoAmbiente)`
  - Adicionar na `mutation_queue`: `action: "CREATE_AMBIENTE_LOCAL"` (novo tipo)
  - Atualizar estado local: `setAmbientes(prev => [...prev, novoAmbiente])`
- [ ] 3.3 — Implementar modal de criação (baseado em RoomOverviewScreen.tsx da referência):
  - Input: nome do cômodo (obrigatório)
  - Seleção: tipo de ícone com 6 opções (Quarto, Sala, Cozinha, Banheiro, Varanda, Outro)
  - Botões: Cancelar + Adicionar
- [ ] 3.4 — Adicionar botão "+ Adicionar Cômodo" na página
  - Posição: abaixo da lista de cômodos ou como FAB (Floating Action Button)
  - Ícone: `add` (Material Symbol)
- [ ] 3.5 — Testar: adicionar cômodo offline e verificar que aparece na lista

---

### ETAPA 4 — Criar vistoria do zero pelo vistoriador
**Arquivos:** `src/app/field/page.tsx` + `src/app/field/vistorias/nova/page.tsx` + `src/lib/db/idb.ts`

- [ ] 4.1 — Atualizar `src/lib/db/idb.ts`
  - Adicionar `"CREATE_VISTORIA_LOCAL"` e `"CREATE_AMBIENTE_LOCAL"` ao tipo `MutationQueueItem.action`
- [ ] 4.2 — Adicionar botão "Nova Vistoria" no dashboard (`/field/page.tsx`)
  - Posição: no header, ao lado do botão de sincronizar
  - Link: `/field/vistorias/nova`
  - Ícone: `add_circle` ou `edit_note`
- [ ] 4.3 — Criar página `/field/vistorias/nova/page.tsx`:
  - TopBar com título "Nova Vistoria" e botão Voltar
  - Formulário com os campos:
    * Endereço (obrigatório)
    * Número
    * Complemento
    * Bairro (obrigatório)
    * Cidade (obrigatório)
    * Estado — select com UFs
    * CEP (opcional)
    * Tipo: radio Entrada / Saída / Contra-Vistoria
    * Data e hora (datetime-local)
    * Nome do Locatário (opcional)
    * Telefone do Locatário (optional, tel)
    * Nome do Proprietário/Locador (opcional)
  - Validação: campos obrigatórios marcados com erro visual
  - Botão "Criar Vistoria" no rodapé (estilo primário grande)
- [ ] 4.4 — Implementar função `handleCreateVistoria`:
  - Gerar `id = "vis-local-" + Date.now()`
  - Gerar `codigo = "VIS-LOCAL-" + Date.now()`
  - Criar objeto `LocalVistoria` completo
  - `db.put("vistorias", novaVistoria)`
  - `db.put("mutation_queue", { action: "CREATE_VISTORIA_LOCAL", ... })`
  - `router.push("/field/vistorias/" + novaVistoria.id)`
- [ ] 4.5 — Testar o fluxo completo: criar → navegar para detalhes → iniciar cômodos

---

### ETAPA 5 — Melhorias de design inspiradas no studio-google
**Referências:** `Referencias/studio-google/src/components/`

- [ ] 5.1 — **Dashboard** (`/field/page.tsx`)
  - Adicionar barra de progresso por vistoria no card da lista
  - Status badge colorido mais expressivo (Entrada = verde, Saída = âmbar)
  - Melhorar o empty state com ícone maior e call-to-action mais claro
  - Botão "Nova Vistoria" no header (vem da Etapa 4)

- [ ] 5.2 — **Detalhe da vistoria** (`/field/vistorias/[id]/page.tsx`)
  - Adicionar quick actions: "GPS / Navegar" e "WhatsApp Locatário"
  - Melhorar o stepper de progresso (1. Info → 2. Protocolo → 3. Cômodos → 4. Fim)
  - Tornar o stepper visual — item atual em destaque colorido

- [ ] 5.3 — **Protocolo de chegada** (seção em `ambientes/page.tsx`)
  - Redesenhar checkboxes como cards clicáveis (toggle card) com ícone por item
  - Ícones sugeridos: 🛡️ gás, 💡 luzes, 🪟 janelas, ❄️ ar-condicionado, 🚿 chuveiro, 🚽 descarga, ⚡ disjuntores, 📞 interfone, 🚪 portão
  - Exibir barra de progresso do protocolo em destaque: "X / 10 concluídos"
  - Ao completar 100%: animação suave + badge "✓ Protocolo Concluído"

- [ ] 5.4 — **Lista de cômodos** (`ambientes/page.tsx`)
  - Cards de cômodo mais expressivos: status visual com cor dominante no card
  - Botão "+ Adicionar Cômodo" (vem da Etapa 3)
  - Melhorar chips de filtro

- [ ] 5.5 — **Detalhe do cômodo** (`ambientes/[ambienteId]/page.tsx`)
  - Header com nome do cômodo e progresso (X/Y itens vistoriados)
  - Empty state quando não há itens (vem da Etapa 2)
  - Cards de item com status badge mais visível

---

## ORDEM DE EXECUÇÃO RECOMENDADA

```
1. Bug 1 (Progresso 0%)     ← mais visível, impacta toda a experiência
2. Bug 2 (Cômodo vazio)     ← bloqueia o uso quando não há itens
3. Bug 3 (Adicionar cômodo) ← funcionalidade ausente crítica
4. Feat 4 (Criar vistoria)  ← funcionalidade nova importante
5. Design 5 (Melhorias UI)  ← polish final e experiência premium
```

---

## ARQUIVOS AFETADOS (RESUMO)

| Arquivo | Etapas |
|---------|--------|
| `src/lib/db/idb.ts` | 4.1 (novos tipos mutation_queue) |
| `src/app/field/page.tsx` | 4.2 + 5.1 (botão nova vistoria + design) |
| `src/app/field/vistorias/nova/page.tsx` | **[NOVO]** 4.3/4.4 (formulário nova vistoria) |
| `src/app/field/vistorias/[id]/page.tsx` | 5.2 (quick actions, stepper) |
| `src/app/field/vistorias/[id]/ambientes/page.tsx` | 1.1-1.4 + 3.1-3.5 + 5.3/5.4 |
| `src/app/field/vistorias/[id]/ambientes/[ambienteId]/page.tsx` | 2.1-2.3 + 5.5 |

---

## REFERÊNCIAS VISUAIS UTILIZADAS

| Componente de referência | O que inspirou |
|--------------------------|----------------|
| `studio-google/components/RoomOverviewScreen.tsx` | Modal add cômodo, cards de cômodo, progresso |
| `studio-google/components/InspectionDetailScreen.tsx` | Quick actions, header premium, bento grid |
| `studio-google/components/DashboardScreen.tsx` | Cards de vistoria, layout dashboard |
| `studio-google/src/App.tsx` | Fluxo geral, estados de navegação |

---

## GUARDRAILS (manter durante toda a implementação)

1. **Offline-first:** toda mutação local deve ir para IDB + `mutation_queue` antes de qualquer rede.
2. **Tokens de cor:** usar somente `primary (#00AEEF)`, `secondary (#1A2B3C)`, `status-good`, `status-warn`, `status-bad`, `brand-accent (#FFB703)` — sem hex soltos.
3. **Touch targets:** todos os botões ≥ 44px de altura.
4. **IDs locais:** usar prefixo `vis-local-`, `amb-local-`, `item-local-` para difereciar do banco.
5. **Não quebrar o que funciona:** não refatorar lógica de sync existente; apenas adicionar novos actions.
6. **Inter é a fonte oficial** — não trocar para outra fonte.
7. **Sem roxo/purple gradients** — paleta Facilita: ciano, navy, âmbar.

---

## LOG DE PROGRESSO

| Data | Etapa | Status | Observações |
|------|-------|--------|-------------|
| 2026-07-16 | Análise e diagnóstico | ✅ Concluído | Bugs identificados, referências analisadas, plano criado |
| 2026-07-16 | Etapa 1: Bug progresso 0% | ✅ Concluído | Checklist redesenhado como toggle cards; progresso calculado como média ponderada |
| 2026-07-16 | Etapa 2: Bug cômodo vazio | ✅ Concluído | Empty state + modal adicionar item + botão flutuante |
| 2026-07-16 | Etapa 3: Adicionar cômodo | ✅ Concluído | Modal com picker de ícone + salvamento no IDB |
| 2026-07-16 | Etapa 4: Criar vistoria | ✅ Concluído | Nova página /field/vistorias/nova + botão no dashboard |
| — | Etapa 5: Melhorias design | ⬜ Pendente | — |

