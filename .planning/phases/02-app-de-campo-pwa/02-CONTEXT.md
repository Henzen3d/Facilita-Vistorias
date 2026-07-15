# Phase 2: App de Campo (PWA) — Núcleo Offline - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Transformar as telas placeholder do app de campo (`/field`) em um PWA funcional com:
1. Instalação na tela inicial do celular (manifest, ícone, splash)
2. Pré-carregamento de vistorias do dia para uso 100% offline via IndexedDB
3. Captura de foto (câmera nativa + galeria) e áudio (estilo WhatsApp) por item
4. Sincronização automática em background com indicadores visuais de status

O vistoriador deve conseguir executar uma vistoria completa sem internet — navegar por ambientes, capturar mídia de cada item, preencher o Protocolo de Chegada — e tudo sincronizar automaticamente quando houver conexão.

</domain>

<decisions>
## Implementation Decisions

### PWA Install & Brand
- **D-01:** Nome do app na tela inicial: "Facilita Vistorias"
- **D-02:** Ícone: azul com a logo da marca Facilita
- **D-03:** Theme color: `#00AEEF` (primary do Design System)
- **D-04:** Splash screen: design simples e limpo, alinhado à identidade visual

### Offline Data Strategy
- **D-05:** Pré-carregar todas as vistorias do dia atribuídas ao vistoriador logado, incluindo dados completos de imóveis, ambientes e pessoas — tudo necessário para trabalhar 100% offline
- **D-06:** Armazenamento local via IndexedDB (`idb` — já instalado como dependência). Nenhuma dependência de rede durante a execução da vistoria

### Capture UX (Foto e Áudio)
- **D-07:** Fotos: usar câmera nativa + acesso à galeria do dispositivo. Permitir múltiplas fotos por item. Preview com opção de apagar/refazer antes de confirmar
- **D-08:** Áudio: botão estilo WhatsApp — tap para iniciar gravação, tap para parar. Exibir contador de segundos durante gravação. Oferecer preview do áudio antes de confirmar e opção de excluir/regravar

### Sync & Status Indicators
- **D-09:** Sincronização automática em background assim que o dispositivo recuperar conexão estável. Sem intervenção manual necessária
- **D-10:** Ícone de nuvem como indicador visual de status por item:
  - Laranja/Slate = pendente (salvo apenas no IndexedDB local)
  - Verde/Azul = sincronizado com o servidor

### Claude's Discretion
- Estratégia de retry e tratamento de falhas de sync (exponential backoff, fila de retry)
- Estrutura exata das stores do IndexedDB (schema das tabelas locais)
- Escolha entre `<input capture>` vs MediaDevices API para câmera
- Implementação específica do service worker e estratégia de cache
- Tratamento de conflitos (ex: item editado no servidor enquanto estava offline)
- Política de limpeza do IndexedDB após sync bem-sucedido (manter cache vs liberar espaço)
- Abordagem para atualização do PWA (prompt de update vs auto-update)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Arquitetura e Design do Sistema
- `SYSTEM_DESIGN.md` §6 — PWA e fluxo offline (pré-carregamento, IndexedDB, background sync, indicadores de status)
- `SYSTEM_DESIGN.md` §3 — Modelo de dados completo (Vistoria, Ambiente, Item, Midia, ChecklistChegada)
- `SYSTEM_DESIGN.md` §8 — Autenticação e papéis (VISTORIADOR com sessão longa de 7 dias no PWA)

### Design System
- `DESIGN.md` §2.1 — Tokens de marca (cores, tipografia)
- `DESIGN.md` §2.4 — Cores semânticas para estado de item (bom/regular/dano)

### Requisitos e Fases
- `TODO.md` — Fase 2 (9 tarefas detalhadas do app de campo)
- `.planning/phases/01-nucleo-de-dados-e-auth/01-CONTEXT.md` — Decisões da Fase 1 (schema, auth, APIs)

### Código Existente
- `src/app/field/` — 10 telas placeholder do app de campo (dashboard, vistoria, ambientes, itens, captura, sync, resumo, sucesso)
- `next.config.ts` — Configuração base Next.js (sem integração next-pwa ativa ainda)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Placeholder screens em `/field`:** 10 páginas já implementadas como mockups estáticos — estrutura de rotas, navegação entre telas, e layout base já definidos. O trabalho é substituir dados mock por dados reais do IndexedDB e adicionar funcionalidade offline
- **`idb` (v8.0.0):** Biblioteca já instalada para IndexedDB — provê API baseada em Promises para operações de banco local
- **`next-pwa` (v5.6.0):** Já instalado, mas não configurado — precisa ser integrado ao `next.config.ts`
- **Design System:** Tokens de cor (`#00AEEF`, `#1A2B3C`, `#F8FAFC`, `#FFB703`), fonte Inter, bordas arredondadas (`rounded-2xl`, `rounded-full`) já padronizados nas telas existentes

### Established Patterns
- **Estrutura de rotas:** App Router do Next.js com `params: Promise<{...}>` para rotas dinâmicas (padrão Next.js 15)
- **Estilização:** Tailwind CSS com classes utilitárias, sem CSS modules. Cores do Design System usadas diretamente (`bg-[#00AEEF]`, `text-[#1A2B3C]`)
- **Layout mobile-first:** `max-w-md mx-auto` em todas as telas, simulando viewport de smartphone
- **Header consistente:** `bg-white px-6 py-4 border-b border-slate-100` com voltar/título/ação em todas as telas

### Integration Points
- **Autenticação:** Todas as telas `/field` devem verificar role `VISTORIADOR` via middleware/session
- **APIs existentes:** `GET /api/vistorias` (listar), `GET /api/vistorias/[id]` (detalhe), endpoints de mídia a serem criados
- **Schema Prisma:** Modelos `Vistoria`, `Ambiente`, `Item`, `Midia`, `ChecklistChegada` já definidos na Fase 1
- **Service Worker:** Será injetado pelo `next-pwa` — precisa de configuração de cache e estratégia de precaching
</code_context>

<specifics>
## Specific Ideas

- O fluxo de passos já está esboçado nas telas: Info → Protocolo → Ambientes → Fim (indicador de progresso no topo da tela de detalhe da vistoria)
- O ícone de sync já tem uma tela placeholder em `/field/sync` com fila de mídia pendente e botão "Tentar Forçar Sync"
- A tela de captura já sugere um FAB menu com opções: Foto | Áudio | Nota | Avaria
- O Protocolo de Chegada tem um trigger "Iniciar Protocolo de Chegada" na tela de detalhe da vistoria, apontando para `/field/vistorias/[id]/ambientes`
- O app deve funcionar como PWA instalável (ícone na tela inicial, tela cheia, sem barra de navegador)

### UI Reference Patterns (Lovable)
- **Caminho das referências:** `j:\Arquivos Osmar\Vistoria Residêncial - NOVO SERVIÇO\App Vistorias\Producao\Referencias\Design\Lovable`
- **Design System:** `src/styles.css` define cores de marca, de status de sync e de gravação de áudio.
- **Layout base:** `src/components/app/PhoneShell.tsx` fornece o mockup mobile-first com aba de navegação inferior (Home, Rooms, Sync, Report) e componente TopBar reutilizável.
- **Dashboard (Home):** `src/routes/home.tsx` com widgets de agenda semanal, estatísticas (StatCard) e lista de vistorias agendadas.
- **Detalhe da Vistoria:** `src/routes/inspection.tsx` com mini cards de dados do imóvel (MiniFact), lista de contatos dos clientes (PersonRow) e sitemap em SVG.
- **Ambientes & Cômodos:** `src/routes/rooms.tsx` mostrando progresso, lista de ambientes e botões com badges semânticos de sync por item.
- **Captura Integrada:** `src/routes/capture.tsx` definindo layout do viewfinder com grid (3x3), controle de flash, waveform para gravação de áudio em progresso e FAB de ações rápidas.
- **Status de Sync:** `src/routes/sync.tsx` definindo badges visuais e barra de progresso para itens locais, enviando e sincronizados (conforme D-10).

</specifics>

<deferred>
## Deferred Ideas

- Comparação automática entrada x saída — Fase 5 (Contestação)
- Assinatura digital no app de campo — Backlog
- Timeline com geolocalização do vistoriador — Backlog
- Modo de revisão da IA no app de campo (editar descrição sugerida) — Fase 3 (Pipeline de IA)

</deferred>

---

*Phase: 02-app-de-campo-pwa*
*Context gathered: 2026-07-14*
