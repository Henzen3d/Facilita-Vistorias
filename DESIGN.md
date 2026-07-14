# DESIGN.md — Design System (Facilita Vistorias App)

> ✅ **Fonte confirmada**: diferente da primeira versão deste documento (que
> estimava a paleta), os valores abaixo vêm **direto** de
> `tailwind_config.js`, `output.css` e `fonts.css` do repositório do site
> institucional — são os valores reais em produção, não uma extrapolação.

> ⚠️ **`code.html` é um rascunho antigo** (provavelmente uma geração anterior
> via Stitch/AI Studio) com paleta **verde** (`#13ec5b`) e texto `#111813` —
> não corresponde à identidade final da marca. **Não usar como referência.**
> A fonte da verdade é `tailwind_config.js` + `output.css`, refletida nas
> páginas atuais (`index.html`, `contra-vistoria.html`, `carreiras.html`,
> `imprensa.html`, `central-de-ajuda.html`, `politica-privacidade.html`).

## 1. Essência da marca

- **Posicionamento**: auditor técnico independente, "do lado do cliente, não
  da imobiliária" — visual precisa transmitir **confiança + leveza**, não
  burocracia pesada de laudo jurídico.
- **Metáfora visual central**: nuvens flutuantes (`cloud-1.png`, `cloud-2.png`,
  `cloud-3.png`) com animações `drift-right` (30s), `drift-left` (40s) e
  `flowAcross`/`drift-fast` (90s) — reforça "clareza" e "tranquilidade".
- **Assinatura tipográfica**: mistura de sans-serif bold (Inter) com uma
  palavra em **serifada itálica** (Instrument Serif) dentro do título — ver
  §3.2. Esse contraste é a marca registrada visual do site, mais do que a
  cor em si.

## 2. Cores (valores reais)

### 2.1 Tokens de marca — `tailwind_config.js`

```js
colors: {
  "primary": "#00AEEF",
  "primary-hover": "#009ACD",
  "secondary": "#1A2B3C",
  "accent": "#FFB703",
  "background-light": "#F8FAFC",
  "background-dark": "#1A2B3C",
  "white": "#FFFFFF",
}
```

| Token | Hex | Uso observado no site |
|---|---|---|
| `primary` | `#00AEEF` | CTAs, links, ícone de marca, bordas de destaque, ícones de "confiança/segurança" |
| `primary-hover` | `#009ACD` | hover/active de botões e links primários |
| `secondary` | `#1A2B3C` | texto principal (`text-secondary`), fundo de seções escuras (não confundir com o preto do rodapé — ver §2.2) |
| `accent` | `#FFB703` | **cor de ícone secundário**, não de CTA — usada em ícones de conteúdo informativo (`verified`, `handshake`, `gavel`, `school`, `trending_up`) em `carreiras.html` e `imprensa.html` |
| `background-light` | `#F8FAFC` | fundo geral do site (é literalmente o `theme-color` do `<meta>`) |
| `white` | `#FFFFFF` | cards, painéis |

> **Importante**: o site **não** usa uma escala de tons (50/100/300/500/700)
> como um Tailwind padrão — usa **um valor fixo por token** e aplica
> opacidade via modificador (`bg-primary/10`, `text-secondary/70`,
> `border-primary/20`) quando precisa de uma variação mais clara. Nosso
> `tailwind.config.ts` deve seguir o mesmo padrão, não inventar uma escala.

### 2.2 Cor adicional descoberta — quase-preto do rodapé

O rodapé (`footer_modelo.html`, replicado em todas as páginas) usa
`bg-[#050505]`, que é **mais escuro que `secondary`** (`#1A2B3C`) — é uma
cor à parte, só para essa superfície:

| Token novo | Hex | Uso |
|---|---|---|
| `ink` | `#050505` | fundo do rodapé (com textura de ruído SVG sutil por cima, opacidade 5%) |

### 2.3 Cor funcional — WhatsApp

Botão flutuante de WhatsApp usa a cor oficial da marca WhatsApp, não a
paleta da Facilita: `#25D366`. É intencional (reconhecimento imediato do
ícone) — manter esse valor exato sempre que replicarmos esse padrão de CTA
no app (ex.: botão de suporte/enviar relatório por WhatsApp).

### 2.4 Cores semânticas do app (não existem no site — são novas, para o fluxo de vistoria)

O site não tem conceito de "estado de item" (bom/regular/dano), então esses
tokens são **novos**, mas alinhados à mesma lógica de badge já usada no site
(fundo claro + texto escuro da mesma família — ver os badges "Urgente"
vermelho e "Economia" verde em `index.html`):

| Token | Fundo | Texto | Estado |
|---|---|---|---|
| `state-good` | `bg-green-100` `#DCFCE7` | `text-green-800` `#166534` | Bom estado |
| `state-fair` | `bg-amber-100` `#FEF3C7` | `text-amber-800` `#92400E` | Desgaste natural |
| `state-bad` | `bg-red-100` `#FEE2E2` | `text-red-700` `#B91C1C` | Dano/avaria |
| `state-pending` | `bg-slate-100` `#F1F5F9` | `text-slate-500` `#64748B` | Aguardando IA |

### 2.5 ⚠️ Regra da auditoria de UX — nunca usar roxo

O relatório `uxxx.txt` (auditoria automatizada do próprio site) sinalizou
**"PURPLE DETECTED — Banned by Maestro rules. Use Teal/Cyan/Emerald instead"**
em duas variações de rascunho do site. Mesmo que um card de depoimento no
`index.html` atual ainda use um roxo (`#2E1A3C`) como fundo de card
individual, **não repetir esse padrão no app** — usar variações de
`primary` (ciano) ou verde/âmbar semânticos no lugar de qualquer roxo.

Outros pontos da mesma auditoria que valem virar regra no app:
- Máximo de 7 itens de navegação visíveis por vez (Hick's Law) — o site
  chegou a ter 24–34 itens de nav em alguns rascunhos, sinalizado como
  problema. No app (uso em campo, decisões rápidas), isso é ainda mais
  crítico.
- Todo input precisa de `<label>` associado (a auditoria pegou inputs sem
  label em `artigo-02-vistoria-entrada-checklist.html`) — regra direta para
  os formulários do app (cadastro de imóvel, revisão de item etc.).
- Line-length de texto entre 45–75ch (`max-w-prose` / `max-w-[65ch]`) —
  aplicar em qualquer bloco de texto longo (descrição de item, relatório
  público).
- Regra 60-30-10 de paleta (dominante/secundária/acento) — o site foi
  sinalizado por ter "14 cores distintas"; no app, manter disciplina: 60%
  `background-light`/branco, 30% `secondary` (texto/estrutura), 10%
  `primary`+`accent` combinados.

## 3. Tipografia

### 3.1 Fontes carregadas (`fonts.css`)

| Fonte | Pesos | Uso |
|---|---|---|
| **Inter** | 400, 700 (e até 900 em algumas páginas) | Fonte oficial de corpo e título — `fontFamily.display` e `fontFamily.sans` no `tailwind_config.js` apontam os dois para Inter |
| **Instrument Serif** | 400, itálico e normal | **Acento editorial** dentro de headlines — ver §3.2 |
| **Material Symbols Outlined** | variável 100–700 | Iconografia (ver §4) |
| ~~Public Sans~~ | 400/500/700/900 | Carregada em `index.html` mas **não referenciada** em nenhuma classe utilitária ativa (`font-display`/`font-sans` apontam só para Inter) — parece resíduo de uma iteração anterior do design. **Não usar no app** para não criar inconsistência; se precisar de uma segunda fonte no futuro, decidir isso deliberadamente, não por herança acidental. |

```css
--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-accent: "Instrument Serif", serif; /* sempre itálico quando usado */
```

### 3.2 Padrão de headline (assinatura visual do site)

Repetido em `index.html` e `contra-vistoria.html`: o título mistura Inter
bold/black com **uma palavra ou frase curta em Instrument Serif itálico**,
geralmente a palavra emocional/humana do título:

> "Seu **espaço** para vistorias **seguras**." (hero)
> "Sua *proteção* técnica contra cobranças indevidas." (contra-vistoria)
> "Processo *simples* e rápido" (timeline)
> "Documentação *completa* e imparcial" (benefícios)
> "Quem já se *protegeu* com a Facilita" (depoimentos)

Classe usada: `font-['Instrument_Serif'] italic font-normal`. **Vale
reaproveitar esse padrão na página de relatório público** (`/r/[token]`) —
é a superfície do app mais próxima do site institucional, então é onde essa
assinatura tipográfica tem mais valor de reconhecimento de marca. **Não
usar** no app de campo/painel admin (uso operacional, precisa ser direto,
sem floreio).

### 3.3 Escala de tamanho (app de campo)

| Estilo | Tamanho / peso | Uso |
|---|---|---|
| Display | 32–40px / 700–900 | Título de tela cheia |
| H1 | 24px / 700 | Título de página |
| H2 | 20px / 600 | Título de seção/card |
| Body | 16px / 400 | Texto padrão — nunca menor que 16px no app de campo |
| Small | 14px / 400 | Metadados, timestamps |
| Caption | 12px / 500 uppercase, tracking+ | Tags de status |

## 4. Iconografia

Confirmado: **Material Symbols Outlined**, configuração padrão
`'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`. Ícones reais observados no site
por contexto (reaproveitar os mesmos símbolos no app garante consistência):

| Contexto no site | Ícone | Uso equivalente no app |
|---|---|---|
| Confirmação / marca | `check_circle` | Logo do app, item concluído |
| Segurança/técnica | `verified_user`, `verified`, `engineering` | Item revisado, vistoriador responsável |
| Urgência | `schedule`, `bolt` | Prazo de contestação, sync pendente |
| Documentação | `description`, `search_check` | Relatório gerado, item em revisão |
| Disputa/legal | `gavel`, `balance` | Contestação |
| Comunicação | `chat`, `mail`, `call` | Envio do relatório |
| Localização | `location_on`, `map` | Endereço do imóvel |
| **(novo, sem equivalente no site)** | `photo_camera`, `mic`, `cloud_sync`, `cloud_done`, `qr_code_2` | Captura de foto/áudio, status offline, QR do relatório |

## 5. Bordas e forma (correção importante)

A versão anterior deste documento estimava um raio máximo de 20px — **está
errado**. O `tailwind_config.js` real sobrescreve o `borderRadius` padrão do
Tailwind e o site usa esses valores **extensivamente** em containers grandes
(hero, footer, cards de serviço):

```js
borderRadius: {
  "DEFAULT": "0.25rem", // 4px
  "lg": "0.5rem",       // 8px
  "xl": "1rem",         // 16px
  "2xl": "1.5rem",      // 24px
  "3xl": "2.5rem",      // 40px
  "full": "9999px",
  "pill": "50px",
}
```

Exemplos reais de uso: hero `rounded-[3rem]` (48px, ainda maior que o `3xl`
do config — usado como valor arbitrário pontual), footer `rounded-[2rem]
md:rounded-[3rem]`, cards de serviço `rounded-[2.5rem]`. **A estética é
"soft/blob"**, não o cantos discretamente arredondados que eu tinha assumido
antes. Botões CTA são **pill** (`rounded-full` ou `rounded-pill`).

No app: manter essa linguagem nos componentes voltados ao cliente
(relatório público, botões de CTA), mas **moderar no painel
admin/operacional** (usar no máximo `xl`/`2xl` em cards de trabalho — muito
arredondado em telas densas de dados atrapalha a leitura).

## 6. Sombras

```js
boxShadow: {
  'soft': '0 4px 6px -1px rgba(0, 174, 239, 0.1)', // sombra tingida de primary, não neutra
}
```

Além dessa sombra "de marca" (tingida de azul), o `output.css` tem uma
progressão de sombras neutras para elevação (`0 12px 45px rgba(0,0,0,.06)`
até `0 25px 60px rgba(0,0,0,.18)` conforme o elemento "sobe" — hover de
cards, por exemplo). Padrão a seguir: **elementos de marca/CTA usam sombra
tingida de `primary`; elevação genérica de card usa sombra neutra preta em
baixa opacidade**, nunca as duas juntas no mesmo elemento.

## 7. Padrão de badge (categorias/tags)

Observado nos cards de serviço (`index.html`/`code.html`): badge = fundo
clarinho + texto escuro da mesma família de cor, `text-xs font-bold
uppercase tracking-wide rounded px-2 py-1`. Exemplos reais: vermelho
("Urgente"), verde via `primary/20` + `text-green-800` ("Economia"), azul
("Segurança"). **Reaproveitar esse exato padrão** para badges de categoria
de item (`piso`, `parede`, `mobiliário`...) e status de vistoria
(`agendada`, `em campo`, `contestada`...) no app — ver tokens semânticos em
§2.4.

## 8. Plugins Tailwind usados pelo site

```js
plugins: [
  require('@tailwindcss/forms'),
  require('@tailwindcss/container-queries'),
  require('@tailwindcss/typography'),
]
```

Recomendo instalar os mesmos três no app (`package.json` já atualizado):
- **`forms`**: nosso app tem muito mais formulário que o site institucional
  (cadastro de imóvel, revisão de item, contestação) — padroniza inputs
  automaticamente.
- **`container-queries`**: útil no app de campo, onde o mesmo componente de
  item pode aparecer em containers de tamanhos diferentes (lista vs. detalhe).
- **`typography`** (`prose`): útil na página de relatório público, que tem
  texto longo (descrição de itens) — mesmo padrão que o blog do site usa.

## 9. Aplicação por superfície (atualizado)

| Superfície | Paleta | Bordas | Tipografia |
|---|---|---|---|
| App de campo (PWA) | `background-light` + `primary` para ações + cores semânticas de estado (§2.4) | moderada (`lg`/`xl`) | só Inter, sem Instrument Serif |
| Painel admin | Branco + `primary` para ações + `secondary/70` para metadados densos | moderada | só Inter |
| Relatório público (`/r/[token]`) | Réplica fiel do site: `primary`, `secondary`, `accent`, nuvens decorativas | **soft/blob** (`2xl`–`3xl`, pill nos CTAs) | Inter + Instrument Serif itálico nos títulos |
| PDF gerado | Versão estática do relatório público | bordas moderadas (PDF não precisa do exagero, só do reconhecimento de marca) | Inter (Instrument Serif pode não estar disponível no motor de PDF — testar; se não renderizar, usar Inter itálico como fallback) |

## 10. Inventário de Telas e Fluxo de Uso

### 10.1 Telas Mapeadas por Superfície

#### 📱 App de campo (vistoriador) — PWA
| # | Tela | Observação |
|---|---|---|
| 1 | Login Simples | E-mail/senha, sessão longa (7 dias). |
| 2 | Home/Dashboard do Vistoriador | Vistorias do dia, mini-calendário, botão "Iniciar Vistoria" (estilo "This Week Overview"). |
| 3 | Detalhe do Agendamento | Endereço, tipo, dados de locador/locatário, botão "Iniciar" (fluxo Info → Meters → Keys → Rooms → Documents). |
| 4 | Visão geral da vistoria | Cards por ambiente com badge de estado geral (verde/amarelo/vermelho) e % concluído. |
| 5 | Ambiente (lista de itens) | Lista de itens do ambiente, cada um com mini-thumb de foto e estado. |
| 6 | Captura de item | Câmera + botão de gravação de áudio + preview. |
| 7 | Menu flutuante (FAB) | Foto / Áudio / Nota de texto / Marcar dano (conforme imagem "menu-flutuante"). |
| 8 | Revisão do item (pós-IA) | Descrição gerada editável + seletor de estado (conforme imagem "score-estado-ambiente"). |
| 9 | Status de sincronização | Fila offline: mídias/checklists sincronizados e pendentes. |
| 10 | Resumo/finalização da vistoria | Score geral, ambientes pendentes, botão "Finalizar". |
| 11 | Sucesso + compartilhar | "Vistoria concluída" + botão de compartilhamento via WhatsApp. |

#### 🖥️ Painel Admin (Gestor/Vera Lúcia)
| # | Tela | Observação |
|---|---|---|
| 12 | Login Admin | Autenticação padrão de gestores (email/senha). |
| 13 | Dashboard de Métricas | Vistorias no mês, tempo médio de entrega, % aceito sem edição, gráficos de status. |
| 14 | Agenda/calendário | Criar/editar agendamentos, atribuir vistoriador responsável. |
| 15 | Lista de vistorias | Filtros por status (agendada, em campo, em revisão, concluída, contestada). |
| 16 | Detalhe da vistoria (admin) | Revisão final ambiente-por-ambiente antes de enviar ao cliente. |
| 17 | Acompanhamento de verificação | Status linear: gerado → enviado → visualizado → confirmado (com timestamps). |
| 18 | Contestações | Lista de contestações abertas pelo cliente + formulário de resposta da equipe. |
| 19 | Cadastros | Cadastro de imóveis, proprietários/locatários e vistoriadores. |

#### 🔗 Cliente (link público com token JWT)
| # | Tela | Observação |
|---|---|---|
| 20 | Relatório digital | Visualização completa de fotos e descrições por ambiente (nuvens, Instrument Serif). |
| 21 | Contestar item | Formulário simples para contestar um item específico. |
| 22 | Confirmação de recebimento | Ação do cliente: "Confirmo que recebi e revisei..." com registro de timestamp. |

## 11. O que ficou pendente / não confirmado

- Não há acesso ao CSS computado real do navegador — os valores acima vêm do `tailwind_config.js`/`output.css` fornecidos, que são a fonte mais confiável disponível.
- Ícones/imagens (`cloud-1.png` etc.) não foram inspecionados visualmente — se quiser reaproveitá-los literalmente no app, copiar do site.
