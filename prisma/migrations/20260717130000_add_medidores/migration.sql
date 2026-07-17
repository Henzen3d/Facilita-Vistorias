-- CreateTable
CREATE TABLE "medidores" (
    "id" TEXT NOT NULL,
    "vistoria_id" TEXT NOT NULL,
    "agua_numero" TEXT,
    "agua_leitura" TEXT,
    "energia_numero" TEXT,
    "energia_leitura" TEXT,
    "gas_numero" TEXT,
    "gas_leitura" TEXT,
    "observacoes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medidores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medidores_vistoria_id_key" ON "medidores"("vistoria_id");

-- AddForeignKey
ALTER TABLE "medidores" ADD CONSTRAINT "medidores_vistoria_id_fkey" FOREIGN KEY ("vistoria_id") REFERENCES "vistorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
