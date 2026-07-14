# TODO / ROADMAP — Facilita Vistorias App

Convenção: marcar `[x]` só quando estiver rodando em Docker localmente, não
apenas escrito.

## Fase 0 — Fundação do projeto
- [ ] `npx create-next-app` (TypeScript, App Router, Tailwind)
- [ ] Configurar Prisma + conexão com Postgres local (docker-compose)
- [ ] Configurar `docker-compose.yml`: app, postgres, redis, minio, cloudflared
- [ ] Configurar ESLint/Prettier + husky (pre-commit)
- [ ] `DESIGN.md` — extrair paleta/tipografia de facilitavistorias.com.br e formalizar tokens de design (cores, espaçamento, componentes base)
- [ ] Estrutura de pastas conforme `SYSTEM_DESIGN.md` §1

## Fase 1 — Núcleo de dados e auth
- [ ] Schema Prisma: Empresa, Usuario, Imovel, Pessoa, Vistoria, Ambiente, Item, Relatorio, ChecklistChegada
- [ ] Migrations iniciais + seed de dados de teste (baseado nos PDFs de exemplo)
- [ ] NextAuth: login admin/vistoriador (credentials)
- [ ] API de agendamento de vistorias (GET, POST, PUT, DELETE)
- [ ] API do dashboard de métricas e KPIs (vistorias/mês, tempo de entrega, taxa de aceitação IA)
- [ ] Estruturar pastas e rotas das 22 telas no Next.js (App Router)
- [ ] CRUD de imóveis e pessoas (locador/locatário)
- [ ] CRUD de agendamento de vistoria (tipo, data, vistoriador responsável)
- [ ] Painel admin: lista de vistorias com status

## Fase 2 — App de campo (PWA) — núcleo offline
- [ ] Configurar `next-pwa` + manifest (ícone, nome, cores da marca)
- [ ] Tela de vistoria em campo: navegação por ambiente → item
- [ ] Tela e fluxo do Protocolo de Chegada (Checklist de ativação antecipada e segurança)
- [ ] Captura de foto (câmera nativa via `<input capture>` ou MediaDevices API)
- [ ] Gravação de áudio (MediaRecorder API)
- [ ] Camada IndexedDB (`idb`): fila local de mídia e checklist pendente
- [ ] Indicador visual de status (salvo local / sincronizando / sincronizado)
- [ ] Background sync ao reconectar (ou fallback com polling)
- [ ] Testar em campo real com sinal ruim/instável (teste manual crítico)

## Fase 3 — Pipeline de IA
- [ ] `lib/ai/router.ts` — `AIProviderRouter` com prioridade configurável
- [ ] Provider Gemini Flash (multimodal: imagem + áudio no mesmo request)
- [ ] Provider fallback pago #1 (OpenAI GPT-4o-mini + Whisper)
- [ ] Provider fallback pago #2 (Claude, opcional)
- [ ] Contador de uso/quota por provedor (Redis) + lógica de troca automática
- [ ] Prompt padrão + validação Zod do JSON de resposta
- [ ] Worker BullMQ: job `processar-item` (mídia → IA → `ANALISE_IA` + `Item.descricao_final`)
- [ ] Tela de revisão: vistoriador/admin edita descrição sugerida por item

## Fase 4 — Relatório final
- [ ] Template React do relatório (mesmo componente para PDF e página pública)
- [ ] Job Puppeteer: HTML → PDF
- [ ] Geração de QR code apontando para link público
- [ ] Página pública `/r/[token]` (JWT assinado, expira)
- [ ] Disclaimer legal padrão no rodapé (ver `CLAUDE.md`)
- [ ] Endpoint `finalizar vistoria` → dispara geração assíncrona

## Fase 5 — Contestação e notificações
- [ ] Fluxo de contestação por item na página pública
- [ ] Notificação por e-mail para a equipe quando houver contestação
- [ ] Deep link `wa.me` para envio manual do relatório
- [ ] Status "contestada" refletido no painel admin

## Fase 6 — Storage e deploy
- [ ] `StorageProvider` abstrato + implementação MinIO
- [ ] Implementação Cloudflare R2 (padrão via `STORAGE_PROVIDER=r2`)
- [ ] Configurar `cloudflared` no compose + subdomínio (`vistorias.facilitavistorias.com.br`)
- [ ] Variáveis de produção documentadas em `.env.example`
- [ ] Backup automatizado do Postgres (cron + `pg_dump` para storage)
- [ ] Deploy em produção e teste ponta a ponta com vistoria real

## Backlog (fase 2 do produto, fora do MVP)
- [ ] Comparação automática entrada x saída (desgaste natural vs dano)
- [ ] Solicitação de orçamento a prestadores de serviço
- [ ] Assinatura digital integrada
- [ ] Geração de DOCX além do PDF
- [ ] Timeline com geolocalização do vistoriador
- [ ] Portal do cliente com histórico
- [ ] Multi-tenant / white-label para outras imobiliárias
