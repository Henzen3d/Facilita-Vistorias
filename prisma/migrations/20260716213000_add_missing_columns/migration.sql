-- CreateEnum if not exists
DO $$ BEGIN
    CREATE TYPE "EstadoConservacao" AS ENUM ('NOVO', 'BOM', 'REGULAR', 'RUIM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum StatusVistoria
ALTER TYPE "StatusVistoria" ADD VALUE IF NOT EXISTS 'EM_REVISAO';

-- AlterTable items
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "estado_conservacao" "EstadoConservacao";

-- AlterTable midias
ALTER TABLE "midias" ADD COLUMN IF NOT EXISTS "transcricao" TEXT;

-- AlterTable analises_ia
ALTER TABLE "analises_ia" ADD COLUMN IF NOT EXISTS "latency_ms" INTEGER;
ALTER TABLE "analises_ia" ADD COLUMN IF NOT EXISTS "used_fallback" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "analises_ia" ADD COLUMN IF NOT EXISTS "guardrail_hit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "analises_ia" ADD COLUMN IF NOT EXISTS "stage" TEXT;

-- AlterTable relatorios
ALTER TABLE "relatorios" ADD COLUMN IF NOT EXISTS "versao_atual" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "relatorios" ADD COLUMN IF NOT EXISTS "historico_geracoes" JSONB NOT NULL DEFAULT '[]';
