-- Phase 5: electronic signature fields + ASSINADA status

-- Enum value (Postgres). Prisma maps StatusRelatorio to this type name.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'StatusRelatorio' AND e.enumlabel = 'ASSINADA'
  ) THEN
    ALTER TYPE "StatusRelatorio" ADD VALUE 'ASSINADA';
  END IF;
END $$;

ALTER TABLE "relatorios"
  ADD COLUMN IF NOT EXISTS "assinado_em" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "assinatura_imagem" TEXT,
  ADD COLUMN IF NOT EXISTS "assinatura_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "assinatura_ip" TEXT,
  ADD COLUMN IF NOT EXISTS "assinatura_device" TEXT,
  ADD COLUMN IF NOT EXISTS "assinatura_nome" TEXT,
  ADD COLUMN IF NOT EXISTS "assinatura_cpf_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "assinatura_cpf_ultimos" VARCHAR(3);
