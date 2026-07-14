-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('ADMIN', 'VISTORIADOR');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('LOCADOR', 'LOCATARIO', 'PROPRIETARIO', 'FIADOR');

-- CreateEnum
CREATE TYPE "TipoVistoria" AS ENUM ('ENTRADA', 'SAIDA', 'PERIODICA', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "StatusVistoria" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusItem" AS ENUM ('PENDENTE', 'CAPTURADO', 'EM_ANALISE', 'ANALISADO', 'REVISADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "TipoMidia" AS ENUM ('FOTO', 'AUDIO');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDENTE', 'UPLOADING', 'UPLOADED', 'SYNCED', 'ERROR');

-- CreateEnum
CREATE TYPE "ProvedorIa" AS ENUM ('GEMINI', 'OPENAI', 'CLAUDE');

-- CreateEnum
CREATE TYPE "StatusContestacao" AS ENUM ('PENDENTE', 'EM_ANALISE', 'ACEITA', 'REJEITADA', 'RESOLVIDA');

-- CreateEnum
CREATE TYPE "StatusRelatorio" AS ENUM ('GERADO', 'ENVIADO', 'VISUALIZADO', 'CONFIRMADO');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL DEFAULT 'VISTORIADOR',
    "empresaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imoveis" (
    "id" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" CHAR(8) NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "documento" TEXT,
    "tipo" "TipoPessoa" NOT NULL,
    "imovelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vistorias" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoVistoria" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" "StatusVistoria" NOT NULL DEFAULT 'AGENDADA',
    "imovelId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token_publico" TEXT,
    "expiracao_token" TIMESTAMP(3),

    CONSTRAINT "vistorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "descricao_final" TEXT,
    "descricao_editada" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusItem" NOT NULL DEFAULT 'PENDENTE',
    "ambienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "analisado_em" TIMESTAMP(3),

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "midias" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMidia" NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "midias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_ia" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "provedor" "ProvedorIa" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "analise" TEXT NOT NULL,
    "confianca" DOUBLE PRECISION,
    "custo" DOUBLE PRECISION,
    "tokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contestacoes" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "status" "StatusContestacao" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvido_em" TIMESTAMP(3),
    "resposta" TEXT,

    CONSTRAINT "contestacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios" (
    "id" TEXT NOT NULL,
    "vistoria_id" TEXT NOT NULL,
    "pdf_storage_key" TEXT NOT NULL,
    "url_publica" TEXT NOT NULL,
    "status" "StatusRelatorio" NOT NULL DEFAULT 'GERADO',
    "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado_em" TIMESTAMP(3),
    "visualizado_em" TIMESTAMP(3),
    "confirmado_em" TIMESTAMP(3),
    "nome_quem_confirmou" TEXT,
    "total_visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_chegada" (
    "id" TEXT NOT NULL,
    "vistoria_id" TEXT NOT NULL,
    "cheiro_gas_ok" BOOLEAN NOT NULL DEFAULT false,
    "luzes_ligadas" BOOLEAN NOT NULL DEFAULT false,
    "janelas_abertas" BOOLEAN NOT NULL DEFAULT false,
    "ar_condicionado_ligado" BOOLEAN NOT NULL DEFAULT false,
    "agua_quente_ligada" BOOLEAN NOT NULL DEFAULT false,
    "descargas_testadas" BOOLEAN NOT NULL DEFAULT false,
    "chuveiros_testados" BOOLEAN NOT NULL DEFAULT false,
    "disjuntores_checados" BOOLEAN NOT NULL DEFAULT false,
    "interfone_testado" BOOLEAN NOT NULL DEFAULT false,
    "portao_garagem_testado" BOOLEAN NOT NULL DEFAULT false,
    "outros_itens" JSONB,
    "ativado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_chegada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nome_key" ON "empresas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vistorias_codigo_key" ON "vistorias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "vistorias_token_publico_key" ON "vistorias"("token_publico");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_empresa_empresaId_chave_key" ON "configuracoes_empresa"("empresaId", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "relatorios_vistoria_id_key" ON "relatorios"("vistoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_chegada_vistoria_id_key" ON "checklist_chegada"("vistoria_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas" ADD CONSTRAINT "pessoas_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistorias" ADD CONSTRAINT "vistorias_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistorias" ADD CONSTRAINT "vistorias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistorias" ADD CONSTRAINT "vistorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambientes" ADD CONSTRAINT "ambientes_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_ambienteId_fkey" FOREIGN KEY ("ambienteId") REFERENCES "ambientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "midias" ADD CONSTRAINT "midias_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestacoes" ADD CONSTRAINT "contestacoes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_empresa" ADD CONSTRAINT "configuracoes_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_vistoria_id_fkey" FOREIGN KEY ("vistoria_id") REFERENCES "vistorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_chegada" ADD CONSTRAINT "checklist_chegada_vistoria_id_fkey" FOREIGN KEY ("vistoria_id") REFERENCES "vistorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
