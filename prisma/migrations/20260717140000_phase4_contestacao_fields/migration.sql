-- Phase 4: client name on contestations
ALTER TABLE "contestacoes" ADD COLUMN IF NOT EXISTS "nome_cliente" TEXT;

CREATE INDEX IF NOT EXISTS "contestacoes_itemId_idx" ON "contestacoes"("itemId");
CREATE INDEX IF NOT EXISTS "contestacoes_status_idx" ON "contestacoes"("status");
