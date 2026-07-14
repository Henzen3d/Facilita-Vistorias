🎉 Fase 0 - Fundação do Projeto - CONCLUÍDA!

  Você agora tem um projeto Next.js 15 completo com todas as configurações básicas. Aqui está o que foi criado:

  ✅ O que foi implementado:

  1. App Next.js 15 - Estrutura completa com App Router
  2. TypeScript - Configurado e pronto
  3. Tailwind CSS - Com PostCSS configurado
  4. Prisma Schema - Modelo de dados completo para vistorias
  5. Configuração Docker - Já existente no docker-compose.yml
  6. Variáveis de ambiente - .env para dev e .env.example
  7. Estrutura de pastas - Organizada conforme SYSTEM_DESIGN.md
  8. Package.json - Com todas dependências do seu projeto original

  📁 Estrutura criada:

  src/
  ├── app/                    # App Router do Next.js
  │   ├── api/               # API Routes
  │   ├── auth/              # Autenticação
  │   ├── admin/             # Painel administrativo
  │   ├── field/             # App de campo (PWA)
  │   └── public/            # Páginas públicas
  ├── lib/                   # Lógica de negócio
  │   ├── db/               # Database (Prisma)
  │   ├── auth/             # Autenticação
  │   ├── queue/            # BullMQ
  │   └── ai/               # IA providers
  ├── components/           # Componentes React
  └── hooks/               # Custom hooks

  🚀 Próximos passos (Fase 1):

  Segundo seu TODO.md, a Fase 1 é:
  1. ✅ Schema Prisma - Já criado
  2. ⏳ Migrations iniciais - Precisa rodar npx prisma migrate dev
  3. ⏳ NextAuth config - Configurar autenticação
  4. ⏳ CRUD de imóveis - Implementar páginas básicas
  5. ⏳ Painel admin - Estrutura inicial

  🔧 Para testar o que foi criado:

  # 1. Rodar serviços Docker
  docker compose up -d postgres redis minio

  # 2. Gerar Prisma Client e rodar migrations
  npx prisma generate
  npx prisma migrate dev --name init

  # 3. Iniciar o app Next.js
  npm run dev

  O app estará disponível em: http://localhost:3000

  📝 O que você gostaria de fazer agora?

  1. Testar o setup básico (rodar Docker + app)
  2. Implementar autenticação (NextAuth)
  3. Criar primeiras páginas (login, dashboard)
  4. Configurar PWA (next-pwa)
  5. Outra prioridade do seu roadmap

  Vamos continuar com qual item?


   Rodando o projeto pela primeira vez no servidor
Depois de subir os arquivos (seja por FileZilla ou Git), execute estes comandos no terminal do Putty:

1. Entre na pasta do projeto:
bash
cd ~/facilita-vistorias

2.Crie o arquivo de configuração de produção a partir do exemplo:
bash
cp env.example .env

3.Edite o .env para colocar as senhas e chaves de API reais de produção:
bash
nano .env
(Para salvar no editor nano: aperte Ctrl + O e Enter. Para sair: Ctrl + X).

4. Dê permissão de execução ao script de deploy:
bash
chmod +x scripts/deploy.sh

5.Inicie a aplicação (o Docker vai baixar as imagens, instalar as dependências e compilar o Next.js):
bash
docker compose up -d --build

6.Rode as migrações do banco de dados (Prisma):
```bash
docker compose exec app npm run prisma:deploy
```

---

### 🔄 Fluxo de Atualização de Código (Git & GitHub)
As modificações **não vão automaticamente**. Quando você ou eu fizermos alterações nos arquivos locais aqui no computador, para mandá-las para o servidor você deve:

1. **Enviar as modificações locais para o GitHub** (eu costumo fazer isso para você no VS Code, mas se quiser fazer manualmente no terminal local):
   ```powershell
   git add .
   git commit -m "Descrição das suas alterações"
   git push
   ```
2. **Puxar e aplicar as modificações no servidor (via Putty)**:
   ```bash
   cd ~/facilita-vistorias
   git pull origin main
   docker compose up -d --build
   docker compose exec app npm run prisma:deploy
   ```

---

### 🐳 Como gerenciar o Docker no Putty
Se o servidor reiniciar ou você precisar iniciar/parar o serviço do Docker e a aplicação:

* **Iniciar o serviço do Docker no servidor (se estiver desligado):**
  ```bash
  sudo systemctl start docker
  ```
* **Verificar se o Docker está ativo:**
  ```bash
  sudo systemctl status docker
  ```
* **Subir a aplicação (dentro da pasta `~/facilita-vistorias`):**
  ```bash
  docker compose up -d
  ```
* **Parar a aplicação (sem apagar os dados):**
  ```bash
  docker compose down
  ```
* **Ver se os containers estão rodando e saudáveis:**
  ```bash
  docker compose ps
  ```
* **Olhar os logs do aplicativo para debugar:**
  ```bash
  docker compose logs -f app
  ```