# Integrações Externas - Facilita Vistorias App

## Armazenamento de Arquivos

### MinIO (Desenvolvimento)
- **Tipo:** S3-compatible object storage
- **Uso:** Ambiente local de desenvolvimento
- **Configuração:** Via docker-compose.yml
- **Console:** http://localhost:9001
- **Bucket padrão:** `vistorias`

### Cloudflare R2 (Produção)
- **Tipo:** S3-compatible object storage
- **Vantagem:** Zero egress fees
- **Configuração:** `STORAGE_PROVIDER=r2`
- **Credenciais:** Via variáveis de ambiente
- **Bucket:** Configurável por ambiente

### Cliente S3
- **SDK:** @aws-sdk/client-s3
- **Abstração:** `StorageProvider` interface
- **Switching:** Baseado em `STORAGE_PROVIDER` env var

## Provedores de IA

### Google Gemini (Padrão)
- **API:** Google Generative AI
- **Modelo:** Gemini Flash 1.5
- **Multimodal:** Suporte a imagem + áudio
- **Limite:** Free tier (15 RPM, 1M tokens/day)

### OpenAI (Fallback #1)
- **API:** OpenAI
- **Modelo:** GPT-4o-mini
- **Transcrição:** Whisper para áudio
- **Custo:** ~$0.15/1M tokens input

### Anthropic Claude (Fallback #2 - Opcional)
- **API:** @anthropic-ai/sdk
- **Modelo:** Claude 3 Haiku/Sonnet
- **Uso:** Quando outros falharem

## Infraestrutura Cloud

### Cloudflare
- **Tunnel:** Zero Trust Network Access
- **DNS:** Gerenciamento de subdomínio
- **R2:** Object storage
- **Vantagem:** Sem necessidade de abrir portas

### Docker Registry (Opcional)
- **Local:** Nexus repository (se aplicável)
- **Público:** Docker Hub / GitHub Container Registry

## Serviços de Terceiros

### Email (Notificações)
- **Finalidade:** Alertas de contestação
- **Provedor:** Configurável (SMTP)
- **Template:** Notificações HTML

### WhatsApp Business API (Futuro)
- **Uso:** Envio de relatórios via deep link
- **Integração:** `wa.me` links

### Geolocation (Futuro)
- **Uso:** Timeline do vistoriador
- **API:** Navegador ou serviço externo

## Monitoramento e Logs

### BullMQ Dashboard
- **Acesso:** `/queues` (protegido)
- **Monitoramento:** Jobs de IA e PDF

### PostgreSQL Monitoring
- **Ferramentas:** pg_stat, logs
- **Backup:** pg_dump automatizado

### Application Logs
- **Estrutura:** JSON logging
- **Níveis:** error, warn, info, debug