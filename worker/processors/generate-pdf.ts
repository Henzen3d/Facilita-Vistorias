import { promises as fs } from "node:fs";
import path from "node:path";
import type { Job } from "bullmq";
import { Prisma, StatusItem, StatusRelatorio, StatusVistoria } from "@prisma/client";
import { prisma } from "../../src/lib/db";
import { generateRelatorioPdfBuffer } from "../../src/lib/pdf/generate-relatorio-pdf";
import { getStorageProvider } from "../../src/lib/storage";
import type { GeneratePdfJob } from "../../src/lib/queue/jobs";

function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

type HistoricoEntry = {
  versionNumber: number;
  userId: string | null;
  userNome: string | null;
  motivo: string | null;
  createdAt: string;
  pdfStorageKey: string | null;
};

function parseHistorico(raw: unknown): HistoricoEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw as HistoricoEntry[];
}

/**
 * Upload PDF to storage; on failure write under public/relatorios/ for local dev.
 * Returns { storageKey, publicFileUrl? }.
 */
async function persistPdf(
  vistoriaId: string,
  buffer: Buffer,
): Promise<{ storageKey: string }> {
  const key = `relatorios/${vistoriaId}.pdf`;

  try {
    const storage = getStorageProvider();
    await storage.upload(key, buffer, "application/pdf");
    return { storageKey: key };
  } catch (err) {
    console.warn(
      "[generate-pdf] storage upload failed — falling back to public/relatorios",
      err instanceof Error ? err.message : err,
    );
    const relPath = `/relatorios/${vistoriaId}.pdf`;
    const absDir = path.join(process.cwd(), "public", "relatorios");
    await fs.mkdir(absDir, { recursive: true });
    await fs.writeFile(path.join(absDir, `${vistoriaId}.pdf`), buffer);
    // Prefix local: so public download route reads from disk
    return { storageKey: `local:${relPath}` };
  }
}

/**
 * BullMQ processor: Puppeteer PDF + QR (via public ?print=1 page) + Relatorio upsert.
 * On failure throws for BullMQ retry (T-03-22).
 */
export async function processGeneratePdf(job: Job<GeneratePdfJob>): Promise<void> {
  const { vistoriaId, requestedByUserId, motivo } = job.data;

  const vistoria = await prisma.vistoria.findUnique({
    where: { id: vistoriaId },
    select: {
      id: true,
      tokenPublico: true,
      relatorio: {
        select: {
          id: true,
          versaoAtual: true,
          historicoGeracoes: true,
          pdfStorageKey: true,
        },
      },
    },
  });

  if (!vistoria) {
    throw new Error(`Vistoria ${vistoriaId} not found`);
  }
  if (!vistoria.tokenPublico) {
    throw new Error(
      `Vistoria ${vistoriaId} missing tokenPublico — finalize before PDF generation`,
    );
  }

  const token = vistoria.tokenPublico;
  const publicUrl = `${appBaseUrl()}/public/r/${token}`;
  const printUrl = `${publicUrl}?print=1`;

  console.info("[generate-pdf] rendering", {
    vistoriaId,
    printUrl,
    jobId: job.id,
  });

  const buffer = await generateRelatorioPdfBuffer({ publicUrl: printUrl });
  const { storageKey } = await persistPdf(vistoriaId, buffer);

  let userNome: string | null = null;
  if (requestedByUserId) {
    const user = await prisma.usuario.findUnique({
      where: { id: requestedByUserId },
      select: { nome: true },
    });
    userNome = user?.nome ?? null;
  }

  const previous = vistoria.relatorio;
  const nextVersion = previous ? previous.versaoAtual + 1 : 1;
  const history = previous ? parseHistorico(previous.historicoGeracoes) : [];
  const entry: HistoricoEntry = {
    versionNumber: nextVersion,
    userId: requestedByUserId ?? null,
    userNome,
    motivo: motivo ?? (previous ? "Regeneração do PDF" : "Geração inicial"),
    createdAt: new Date().toISOString(),
    pdfStorageKey: storageKey,
  };
  history.push(entry);

  const urlPublica = publicUrl;
  const now = new Date();

  await prisma.relatorio.upsert({
    where: { vistoriaId },
    create: {
      vistoriaId,
      pdfStorageKey: storageKey,
      urlPublica,
      status: StatusRelatorio.GERADO,
      geradoEm: now,
      versaoAtual: nextVersion,
      historicoGeracoes: history as unknown as Prisma.InputJsonValue,
    },
    update: {
      pdfStorageKey: storageKey,
      urlPublica,
      status: StatusRelatorio.GERADO,
      geradoEm: now,
      versaoAtual: nextVersion,
      historicoGeracoes: history as unknown as Prisma.InputJsonValue,
    },
  });

  // Mark items that already reached review as FINALIZADO; set vistoria FINALIZADA
  await prisma.item.updateMany({
    where: {
      ambiente: { vistoriaId },
      status: { in: [StatusItem.REVISADO, StatusItem.FINALIZADO] },
    },
    data: { status: StatusItem.FINALIZADO },
  });

  await prisma.vistoria.update({
    where: { id: vistoriaId },
    data: { status: StatusVistoria.FINALIZADA },
  });

  console.info("[generate-pdf] done", {
    vistoriaId,
    storageKey,
    version: nextVersion,
    bytes: buffer.length,
  });
}
