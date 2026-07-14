# Stack Tecnológica - Facilita Vistorias App

## Frontend
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + Design System próprio
- **PWA:** next-pwa para funcionalidade offline

## Backend
- **Runtime:** Node.js (via Next.js API Routes)
- **ORM:** Prisma
- **Banco de dados:** PostgreSQL 16
- **Fila de tarefas:** BullMQ + Redis

## Armazenamento (Storage)
### Opções S3-compatíveis:
1. **MinIO** (local/staging)
   - Auto-hospedado no Docker
   - Para desenvolvimento e testes

2. **Cloudflare R2** (produção)
   - Sem custos de egress
   - Configurável via `STORAGE_PROVIDER=r2`

### SDK:
- **@aws-sdk/client-s3** - Cliente compatível com ambas soluções
- **@aws-sdk/s3-request-presigner** - URLs assinadas

## Inteligência Artificial
### Provedores principais:
1. **Google Gemini Flash** (padrão/free-tier)
   - Multimodal (imagem + áudio)
   - Camada gratuita

2. **Fallback pago:**
   - OpenAI GPT-4o-mini + Whisper
   - Claude (Anthropic) - opcional

### Gerenciamento:
- Router inteligente entre provedores
- Contador de uso/quota no Redis
- Troca automática por falhas

## Infraestrutura
- **Containerização:** Docker + Docker Compose
- **Exposição:** Cloudflare Tunnel (zero trust)
- **Monitoramento:** BullMQ dashboard + logs
- **Backup:** pg_dump automatizado

## Características especiais
- **PWA offline-first** com IndexedDB
- **Processamento assíncrono** de IA
- **Template único** para PDF e página web
- **QR Code** para acesso público
- **Fluxo de contestação** por item