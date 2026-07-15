# Phase 1: Núcleo de dados e auth - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Source:** TODO.md Phase 1 section

## Phase Boundary

Implementar o núcleo de dados e autenticação do sistema Facilita Vistorias, incluindo:
1. Schema Prisma completo para o domínio de vistorias
2. Sistema de autenticação com NextAuth
3. APIs CRUD para entidades principais
4. Estrutura básica do painel administrativo

## Implementation Decisions

### Database Schema
- Schema Prisma completo com: Empresa, Usuario, Imovel, Pessoa, Vistoria, Ambiente, Item, Relatorio, ChecklistChegada
- Migrations iniciais + seed de dados de teste baseado nos PDFs de exemplo

### Authentication
- NextAuth com Credentials Provider para login de admin/vistoriador
- Roles: admin e vistoriador
- Proteção de rotas baseada em roles

### API Structure
- API REST para agendamento de vistorias (GET, POST, PUT, DELETE)
- API do dashboard com métricas e KPIs
- CRUD completo para imóveis e pessoas (locador/locatário)

### Frontend Structure
- Estruturar pastas e rotas das 22 telas no Next.js App Router
- Painel admin com lista de vistorias e status
- Formulários CRUD para todas as entidades principais

## Technical Stack Constraints
- Next.js 15 com App Router
- TypeScript
- Prisma + PostgreSQL
- NextAuth.js
- Tailwind CSS para UI

## Success Criteria
- Schema Prisma migrado e funcionando
- Autenticação funcionando com roles
- Todas as APIs CRUD implementadas
- Painel admin acessível e funcional
- Estrutura de pastas organizada conforme SYSTEM_DESIGN.md

---
*Phase: 01-nucleo-de-dados-e-auth*
*Context gathered: 2026-07-14 from TODO.md*