---
phase: 1
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - src/app/api/auth/[...nextauth]/route.ts
  - src/app/api/imoveis/route.ts
  - src/app/api/pessoas/route.ts
  - src/app/api/vistorias/route.ts
  - src/app/api/agendamentos/route.ts
  - src/app/admin/page.tsx
  - src/app/admin/layout.tsx
  - src/app/admin/imoveis/page.tsx
  - src/app/admin/pessoas/page.tsx
  - src/app/admin/vistorias/page.tsx
  - src/lib/auth.ts
  - src/lib/db.ts
  - .env
  - .env.example
autonomous: true
requirements: [F1.1, F1.2, F1.3, F1.4, F1.5, F1.6, F1.7, F1.8, F1.9]
---

# PLAN: Fase 1 - Núcleo de dados e auth

**Goal:** Implementar schema Prisma completo, autenticação NextAuth, APIs CRUD e painel admin básico.

## Overview

Esta fase estabelece a fundação do sistema com:
1. Modelo de dados completo no Prisma
2. Sistema de autenticação com roles
3. APIs REST para todas as entidades principais
4. Estrutura básica do painel administrativo

---

<task>
<id>1</id>
<type>execute</type>
<subject>Expandir schema Prisma com entidades completas</subject>
<action>
1. Abrir `prisma/schema.prisma`
2. Adicionar modelos faltantes baseado no contexto:
   - Empresa: id, nome, cnpj, telefone, email, endereco
   - Usuario: id, nome, email, senhaHash, role (ADMIN, VISTORIADOR), empresaId
   - Imovel: id, endereco, numero, complemento, bairro, cidade, estado, cep, tipo (APARTAMENTO, CASA, COMERCIAL), locadorId, locatarioId
   - Pessoa: id, nome, cpf, telefone, email, tipo (LOCADOR, LOCATARIO)
   - Vistoria: id, imovelId, tipo (ENTRADA, SAIDA, CONTRA, COMPRA_SEGURA), dataAgendada, dataRealizada, vistoriadorId, status (AGENDADA, EM_CAMPO, EM_REVISAO, CONCLUIDA, CONTESTADA)
   - Ambiente: id, vistoriaId, nome, ordem
   - Item: id, ambienteId, nome, descricao, descricaoFinal, status (NORMAL, DANIFICADO, AUSENTE), fotos (array de URLs), audioUrl
   - Relatorio: id, vistoriaId, tokenPublico, pdfUrl, dataGeracao
   - ChecklistChegada: id, vistoriaId, item, checked
3. Definir relações conforme diagrama do SYSTEM_DESIGN.md
4. Salvar arquivo
</action>
<read_first>
- prisma/schema.prisma
- SYSTEM_DESIGN.md
- TODO.md (seção Fase 1)
</read_first>
<acceptance_criteria>
- `prisma/schema.prisma` contém todos os 9 modelos listados
- Cada modelo tem pelo menos 5 campos relevantes
- Relações (hasMany, belongsTo) estão definidas corretamente
- Campo `role` em Usuario aceita apenas 'ADMIN' ou 'VISTORIADOR'
- Campo `tipo` em Vistoria aceita apenas 'ENTRADA', 'SAIDA', 'CONTRA', 'COMPRA_SEGURA'
- Comando `npx prisma validate` executa sem erros
</acceptance_criteria>
</task>

---

<task>
<id>2</id>
<type>execute</type>
<subject>Rodar migration inicial e criar seed de dados</subject>
<action>
1. Executar: `npx prisma migrate dev --name init_complete_schema`
2. Criar arquivo `prisma/seed.ts` com:
   - 1 empresa de exemplo
   - 2 usuários (1 admin, 1 vistoriador)
   - 3 imóveis de exemplo
   - 5 pessoas (locadores/locatários)
   - 2 vistorias agendadas
3. Executar seed: `npx prisma db seed`
4. Verificar dados no Prisma Studio: `npx prisma studio`
</action>
<read_first>
- prisma/schema.prisma (após task 1)
- .env (conexão com PostgreSQL)
</read_first>
<acceptance_criteria>
- Migration criada em `prisma/migrations/`
- `prisma/seed.ts` existe e contém dados de exemplo
- Comando `npx prisma db seed` executa sem erros
- Prisma Studio abre e mostra dados inseridos
- Tabelas existem no banco PostgreSQL
</acceptance_criteria>
</task>

---

<task>
<id>3</id>
<type>execute</type>
<subject>Configurar NextAuth com Credentials Provider</subject>
<action>
1. Criar `src/lib/auth.ts` com:
   - Configuração NextAuth
   - Credentials provider com email/senha
   - Callbacks para roles
   - Session configuration
2. Criar `src/app/api/auth/[...nextauth]/route.ts`
3. Atualizar `.env` com:
   - NEXTAUTH_URL=http://localhost:3000
   - NEXTAUTH_SECRET=(gerar com `openssl rand -base64 32`)
4. Criar `src/middleware.ts` para proteção de rotas
5. Criar páginas de login: `src/app/login/page.tsx` e `src/app/register/page.tsx`
</action>
<read_first>
- NextAuth.js documentation
- .env.example (estrutura de variáveis)
- prisma/schema.prisma (modelo Usuario)
</read_first>
<acceptance_criteria>
- `src/lib/auth.ts` exporta configuração NextAuth com Credentials provider
- Rota `/api/auth/[...nextauth]` responde 200
- Login funciona com usuário do seed
- Session contém role do usuário
- Middleware redireciona usuários não autenticados
- Páginas `/login` e `/register` existem e são funcionais
</acceptance_criteria>
</task>

---

<task>
<id>4</id>
<type>execute</type>
<subject>Criar API CRUD para imóveis</subject>
<action>
1. Criar `src/app/api/imoveis/route.ts` com:
   - GET: listar imóveis (com paginação)
   - POST: criar imóvel (com validação)
   - PUT: atualizar imóvel
   - DELETE: deletar imóvel
2. Criar `src/lib/validators/imovel.ts` com schema Zod
3. Implementar proteção por role (apenas admin)
4. Testar com curl/Postman
</action>
<read_first>
- prisma/schema.prisma (modelo Imovel)
- src/lib/auth.ts (funções de autenticação)
- src/lib/db.ts (conexão Prisma)
</read_first>
<acceptance_criteria>
- Rota `GET /api/imoveis` retorna lista de imóveis
- Rota `POST /api/imoveis` cria imóvel com dados válidos
- Rota `PUT /api/imoveis/:id` atualiza imóvel existente
- Rota `DELETE /api/imoveis/:id` deleta imóvel
- Rotas protegidas retornam 401 para não autenticados
- Rotas retornam 403 para vistoriador tentando POST/PUT/DELETE
- Validação Zod rejeita dados inválidos
</acceptance_criteria>
</task>

---

<task>
<id>5</id>
<type>execute</type>
<subject>Criar API CRUD para pessoas (locadores/locatários)</subject>
<action>
1. Criar `src/app/api/pessoas/route.ts` com operações CRUD
2. Criar `src/lib/validators/pessoa.ts` com schema Zod
3. Implementar filtro por tipo (LOCADOR, LOCATARIO)
4. Testar endpoints
</action>
<read_first>
- prisma/schema.prisma (modelo Pessoa)
- src/app/api/imoveis/route.ts (padrão a seguir)
</read_first>
<acceptance_criteria>
- CRUD completo para pessoas funcionando
- Filtro `?tipo=LOCADOR` retorna apenas locadores
- Validação funciona para CPF, telefone, email
- Relacionamentos com imóveis preservados
</acceptance_criteria>
</task>

---

<task>
<id>6</id>
<type>execute</type>
<subject>Criar API para agendamento de vistorias</subject>
<action>
1. Criar `src/app/api/vistorias/route.ts` (CRUD vistorias)
2. Criar `src/app/api/agendamentos/route.ts` (endpoints específicos de agendamento)
3. Implementar validação de conflitos de datas
4. Criar endpoints para dashboard:
   - `GET /api/dashboard/metricas` (vistorias/mês, tempo médio)
   - `GET /api/dashboard/kpis` (taxa aceitação IA, etc.)
</action>
<read_first>
- prisma/schema.prisma (modelos Vistoria, Usuario, Imovel)
- TODO.md (requisitos de dashboard)
</read_first>
<acceptance_criteria>
- Agendamento respeita disponibilidade do vistoriador
- Dashboard retorna métricas reais do banco
- KPIs calculados corretamente
- Status da vistoria segue fluxo definido
</acceptance_criteria>
</task>

---

<task>
<id>7</id>
<type>execute</type>
<subject>Estruturar pastas e rotas das 22 telas</subject>
<action>
1. Criar estrutura de pastas conforme SYSTEM_DESIGN.md:
   ```
   src/app/admin/
     layout.tsx
     page.tsx (dashboard)
     imoveis/
       page.tsx
       [id]/page.tsx
     pessoas/
       page.tsx
       [id]/page.tsx
     vistorias/
       page.tsx
       [id]/page.tsx
       agendar/page.tsx
     configuracoes/
       page.tsx
   src/app/login/
     page.tsx
   src/app/register/
     page.tsx
   src/app/public/
     relatorio/[token]/page.tsx
   ```
2. Criar componentes compartilhados em `src/components/admin/`
3. Configurar layouts com sidebar de navegação
</action>
<read_first>
- SYSTEM_DESIGN.md (estrutura de pastas)
- DESIGN.md (paleta e componentes)
</read_first>
<acceptance_criteria>
- Todas as 22 rotas mencionadas existem
- Layout admin com sidebar funcional
- Navegação entre páginas funciona
- Proteção por role aplicada a todas as rotas admin
- Componentes compartilhados reutilizáveis
</acceptance_criteria>
</task>

---

<task>
<id>8</id>
<type>execute</type>
<subject>Implementar painel admin básico</subject>
<action>
1. Criar `src/app/admin/page.tsx` com:
   - Cards de resumo (total vistorias, pendentes, concluídas)
   - Gráfico simples de vistorias por mês
   - Lista de vistorias recentes
2. Criar `src/app/admin/vistorias/page.tsx` com:
   - Tabela de vistorias com filtros (status, tipo, data)
   - Ações: ver detalhes, editar, cancelar
3. Implementar componentes de tabela reutilizáveis
4. Adicionar busca e paginação
</action>
<read_first>
- src/app/api/dashboard/route.ts (dados para o dashboard)
- DESIGN.md (design system)
- Tailwind CSS documentation
</read_first>
<acceptance_criteria>
- Dashboard mostra dados em tempo real
- Tabela de vistorias suporta filtros múltiplos
- Paginação funciona com grande volume de dados
- Design segue identidade visual do projeto
- Responsivo para mobile
</acceptance_criteria>
</task>

---

<task>
<id>9</id>
<type>execute</type>
<subject>Criar CRUD frontend para imóveis e pessoas</subject>
<action>
1. Em `src/app/admin/imoveis/page.tsx`:
   - Lista de imóveis com busca
   - Botão "Novo Imóvel"
   - Modal/formulário para criação/edição
2. Em `src/app/admin/pessoas/page.tsx`:
   - Lista separada por tipo (locadores/locatários)
   - Formulário com validação
3. Implementar confirmação para deleção
4. Adicionar feedback visual (toasts) para ações
</action>
<read_first>
- src/app/api/imoveis/route.ts (API endpoints)
- src/app/api/pessoas/route.ts (API endpoints)
- src/components/admin/ (componentes reutilizáveis)
</read_first>
<acceptance_criteria>
- CRUD completo funcional no frontend
- Validação em tempo real nos formulários
- Confirmação antes de deleções
- Feedback visual para todas as ações
- Sincronização automática após mudanças
</acceptance_criteria>
</task>

---

## Verification Criteria

### Must Haves (Goal-Backward)
1. ✅ Schema Prisma migrado com todas as 9 entidades
2. ✅ Autenticação funcionando com roles admin/vistoriador
3. ✅ Todas as APIs CRUD respondendo corretamente
4. ✅ Painel admin acessível apenas para admin
5. ✅ Estrutura de 22 telas implementada
6. ✅ Dashboard mostra métricas reais do banco

### Smoke Tests
1. Login com usuário admin → acessa painel admin
2. Login com usuário vistoriador → não acessa painel admin
3. CRUD imóvel via API → sucesso
4. CRUD imóvel via frontend → sucesso
5. Agendamento vistoria → aparece no dashboard

### Integration Checks
1. Banco de dados contém dados do seed
2. NextAuth session contém role correta
3. APIs retornam dados do Prisma (não mock)
4. Frontend consome APIs reais
5. Proteção de rotas funciona em todas as páginas

---

## Notes

### Dependencies
- PostgreSQL rodando via Docker
- Node.js 18+
- Prisma CLI instalado

### Deployment Readiness
- Variáveis de ambiente documentadas em `.env.example`
- Migrations podem ser rodadas em produção com `prisma migrate deploy`
- NextAuth configurado para produção

### Rollback Plan
1. Reverter última migration: `npx prisma migrate resolve --rolled-back <migration_name>`
2. Remover arquivos criados nas tasks
3. Restaurar backup do schema anterior

---

*Planejado: 2026-07-14*
*Estimativa: 8-12 horas de desenvolvimento*
*Complexidade: Médio (fundação do sistema)*