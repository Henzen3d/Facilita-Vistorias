# Plano de Implementação — Fase 02: App de Campo (PWA) e Núcleo Offline

Este plano detalha as tarefas necessárias para transformar as telas placeholder existentes em `src/app/field` em um aplicativo PWA funcional, capaz de realizar vistorias 100% offline, capturar fotos e áudios, e sincronizar os dados automaticamente com o servidor local.

Todas as implementações de interface e design seguirão estritamente os modelos e referências gerados no Lovable em `Referencias/Design/Lovable/src/`.

---

## 🌊 Ondas de Execução

```mermaid
grid-layout
  lane "Wave 0: Infra & PWA"
    "Configure next-pwa" --> "Setup Layout & Icons"
  lane "Wave 1: Offline Core"
    "Setup IndexedDB Schema" --> "Preload Daily Inspections" --> "Dashboard & Detail Pages"
  lane "Wave 2: Captura & Midia"
    "Rooms & Items Flow" --> "Camera & Audio Capture Hooks" --> "Viewfinder & Review UI"
  lane "Wave 3: Sync & Status"
    "Local Mutation Queue" --> "Auto-Sync Engine" --> "Sync View & Sync Status Badges"
```

---

## 🛠️ Detalhamento das Ondas e Tarefas

### Wave 0: Infraestrutura, Design System e PWA
*Objetivo:* Configurar o PWA, manifest, ícones, fontes e integrar as variáveis de estilo do Lovable ao Tailwind.

#### [NEW] [next-pwa setup]
- Configurar o wrapper `next-pwa` no `next.config.ts`.
- Criar a rota do manifesto (`public/manifest.json`) com nome "Facilita Vistorias", cor `#00AEEF` e configurar os ícones do aplicativo.
- Registrar o Service Worker com estratégias de cache para ativos estáticos.

#### [MODIFY] [tailwind.config.ts](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/tailwind.config.ts)
- Adicionar os tokens de cor do Lovable ao arquivo de configuração do Tailwind (primary: `#00AEEF`, secondary: `#1A2B3C`, brand-accent: `#FFB703`, status-good, status-warn, status-bad).
- Mapear a fonte "Inter" como padrão.

#### [NEW] [src/components/app/Icon.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/components/app/Icon.tsx)
- Criar o componente `Icon` baseado em [Icon.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/components/app/Icon.tsx) para carregar os Material Symbols.

#### [NEW] [src/app/field/layout.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/layout.tsx)
- Implementar o layout mobile centralizado (`max-w-[430px] mx-auto`) com a falsa barra de status e o bottom navigation bar de 4 abas (Home, Rooms, Sync, Report) usando o padrão do [PhoneShell.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/components/app/PhoneShell.tsx).

---

### Wave 1: Banco Local (IndexedDB) e Pre-loading
*Objetivo:* Criar a estrutura do banco local no IndexedDB com o schema equivalente ao Prisma do backend e implementar a carga inicial dos dados.

#### [NEW] [src/lib/db/idb.ts](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/lib/db/idb.ts)
- Definir o schema do IndexedDB via biblioteca `idb` com as stores: `vistorias`, `ambientes`, `itens`, `midias` e `checklists`.

#### [NEW] [src/hooks/usePreload.ts](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/hooks/usePreload.ts)
- Hook para buscar vistorias do dia via API REST (`/api/vistorias`) e salvá-las no IndexedDB local ao inicializar a sessão do Vistoriador.

#### [MODIFY] [src/app/field/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/page.tsx)
- Substituir a tela dashboard placeholder estática pela versão conectada ao IndexedDB local, desenhando o calendário semanal, estatísticas e listando as vistorias do dia usando a UI de [home.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/home.tsx).

#### [MODIFY] [src/app/field/vistorias/[id]/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/vistorias/%5Bid%5D/page.tsx)
- Página de detalhe da vistoria puxando dados locais do IndexedDB. Exibir dados do imóvel, contatos com botão de discagem direta e barra de progresso visual de etapas baseado em [inspection.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/inspection.tsx).

---

### Wave 2: Captura de Foto/Áudio e Fluxo de Cômodos
*Objetivo:* Implementar a seleção de cômodos, itens, gravação de áudio e captura com câmera nativa usando o design fotográfico do Lovable.

#### [MODIFY] [src/app/field/vistorias/[id]/ambientes/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/vistorias/%5Bid%5D/ambientes/page.tsx)
- Listar cômodos do imóvel e itens do checklist. Adicionar contadores de progresso e badges de status de sync por item (D-10) baseados em [rooms.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/rooms.tsx).

#### [NEW] [src/hooks/useCamera.ts](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/hooks/useCamera.ts)
- Hook para gerenciar captura de fotos através do input de câmera nativo do dispositivo (`<input type="file" accept="image/*" capture="environment">`) para maior compatibilidade mobile.

#### [NEW] [src/hooks/useAudioRecorder.ts](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/hooks/useAudioRecorder.ts)
- Hook para gravação de áudio contínua (inicia e para no mesmo botão estilo WhatsApp) utilizando `MediaRecorder` com formato `audio/webm` (ou `audio/mp4` em iOS/Safari).

#### [MODIFY] [src/app/field/vistorias/[id]/ambientes/[ambienteId]/itens/[itemId]/capture/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/vistorias/%5Bid%5D/ambientes/%5BambienteId%5D/itens/%5BitemId%5D/capture/page.tsx)
- Tela de captura integrada. Layout escuro baseado em [capture.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/capture.tsx) com grid 3x3, waveform dinâmico durante gravação de áudio e FAB flutuante para ações rápidas.

#### [MODIFY] [src/app/field/vistorias/[id]/ambientes/[ambienteId]/itens/[itemId]/review/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/vistorias/%5Bid%5D/ambientes/%5BambienteId%5D/itens/%5BitemId%5D/review/page.tsx)
- Tela de revisão de mídia capturada (foto/áudio) baseada em [review.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/review.tsx). Permite excluir fotos, ouvir o áudio gravado e salvar no IndexedDB com status local pendente.

---

### Wave 3: Sincronização Offline em Background
*Objetivo:* Criar a engine de fila de sync local, detecção de conexão e envio em background com barra de progresso visual.

#### [NEW] [src/lib/sync/syncQueue.ts](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/lib/sync/syncQueue.ts)
- Tabela local `mutation_queue` para guardar operações pendentes (captura de mídia, preenchimento de checklist).
- Implementar listeners de rede (`online`, `offline`) para disparar tentativas automáticas de sincronização.

#### [NEW] [src/hooks/useSyncEngine.ts](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/hooks/useSyncEngine.ts)
- Engine de sincronização que lê a fila de mutações pendentes e faz upload sequencial (Multipart Form Data para mídias).

#### [MODIFY] [src/app/field/sync/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/sync/page.tsx)
- Tela de status de sincronização baseada em [sync.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/sync.tsx). Exibe banner offline (`wifi_off`), lista de arquivos pendentes, barra de progresso do upload geral e botão "Sincronizar agora".

#### [MODIFY] [src/app/field/vistorias/[id]/resumo/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/vistorias/%5Bid%5D/resumo/page.tsx) & [sucesso/page.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/src/app/field/vistorias/%5Bid%5D/sucesso/page.tsx)
- Telas de finalização baseadas em [summary.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/summary.tsx) e [success.tsx](file:///j:/Arquivos%20Osmar/Vistoria%20Resid%C3%AAncial%20-%20NOVO%20SERVI%C3%87O/App%20Vistorias/Producao/Referencias/Design/Lovable/src/routes/success.tsx).

---

## 🧪 Plano de Verificação

### Testes Automatizados (com Vitest)
1. **IndexedDB Schema & Stores:** Validar se as stores locais guardam corretamente as vistorias, itens e mídias sem rede.
   - `npx vitest run src/lib/db/__tests__/idb.test.ts`
2. **Câmera & Áudio:** Validar se o MediaRecorder gera Blobs de áudio reproduzíveis e em formato suportado.
   - `npx vitest run src/hooks/__tests__/useAudioRecorder.test.ts`
3. **Fila de Sync (SyncQueue):** Validar se as mutações são adicionadas à fila quando offline e limpas após sync bem-sucedido.
   - `npx vitest run src/lib/sync/__tests__/syncQueue.test.ts`

### Verificação Manual
- Emulador mobile do Chrome DevTools: Simular modo offline (`Throttling -> Offline`), realizar vistorias completas adicionando fotos e áudio por item.
- Ativar internet novamente e validar se a engine sincroniza tudo em segundo plano e se os badges de nuvem mudam de cor (Laranja/Cinza → Verde/Azul).
