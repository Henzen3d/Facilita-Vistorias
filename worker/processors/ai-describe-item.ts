import { promises as fs } from "node:fs";
import type { Job } from "bullmq";
import { UnrecoverableError } from "bullmq";
import { TipoMidia, type Midia } from "@prisma/client";
import { prisma } from "../../src/lib/db";
import { AIRouter } from "../../src/lib/ai/router";
import { mapItemStateToPrisma } from "../../src/lib/ai/schemas";
import {
  getStorageProvider,
  resolveLocalUploadPath,
} from "../../src/lib/storage";
import type { AiDescribeItemJob } from "../../src/lib/queue/jobs";

const PROMPTS_VERSION = "phase3-v1";

function guessMimeType(midia: Midia): string {
  const source = `${midia.url} ${midia.key}`.toLowerCase();
  if (midia.tipo === TipoMidia.AUDIO) {
    if (source.includes(".wav")) return "audio/wav";
    if (source.includes(".ogg")) return "audio/ogg";
    if (source.includes(".mp3") || source.includes(".mpeg")) return "audio/mpeg";
    if (source.includes(".m4a") || source.includes(".mp4")) return "audio/mp4";
    return "audio/webm";
  }
  if (source.includes(".png")) return "image/png";
  if (source.includes(".webp")) return "image/webp";
  if (source.includes(".gif")) return "image/gif";
  return "image/jpeg";
}

/**
 * Load midia bytes: prefer local public/uploads, else signed URL from storage key.
 * Never trusts free-form client paths from the job payload (T-03-10).
 */
async function loadMidiaBytes(midia: Midia): Promise<Buffer> {
  if (midia.url.startsWith("/uploads/")) {
    try {
      const localPath = resolveLocalUploadPath(midia.url);
      return await fs.readFile(localPath);
    } catch {
      // fall through to storage
    }
  }

  if (midia.key) {
    const storage = getStorageProvider();
    const signedUrl = await storage.getSignedUrl(midia.key);
    const res = await fetch(signedUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to download midia ${midia.id} from storage (HTTP ${res.status})`,
      );
    }
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error(
    `Cannot load midia ${midia.id}: no local file and no storage key`,
  );
}

/**
 * Pick principal photo (first captured — D-08) and latest audio for STT.
 */
function selectMedia(midias: Midia[]): {
  foto: Midia | null;
  audio: Midia | null;
} {
  const fotos = midias
    .filter((m) => m.tipo === TipoMidia.FOTO)
    .sort(
      (a, b) =>
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
    );
  const audios = midias
    .filter((m) => m.tipo === TipoMidia.AUDIO)
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );

  return {
    foto: fotos[0] ?? null,
    audio: audios[0] ?? null,
  };
}

/**
 * BullMQ processor: STT → multimodal description → Prisma persistence.
 * Linear two-stage pipeline — no agent frameworks.
 */
export async function processAiDescribeItem(
  job: Job<AiDescribeItemJob>,
): Promise<void> {
  const { itemId, vistoriaId } = job.data;

  console.info("[ai-describe-item] start", {
    jobId: job.id,
    itemId,
    vistoriaId,
    attempt: job.attemptsMade + 1,
  });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      midias: true,
      ambiente: { select: { vistoriaId: true } },
    },
  });

  if (!item) {
    throw new UnrecoverableError(`Item not found: ${itemId}`);
  }

  // T-03-13: reject cross-tenant / mismatched vistoria jobs
  if (!item.ambiente || item.ambiente.vistoriaId !== vistoriaId) {
    throw new UnrecoverableError("Item does not belong to vistoria");
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { status: "EM_ANALISE" },
  });

  const { foto, audio } = selectMedia(item.midias);

  if (!foto || !audio) {
    // Not ready (D-06): both photo + audio required — leave recoverable CAPTURADO
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "CAPTURADO" },
    });
    console.info("[ai-describe-item] not ready — missing foto or audio", {
      jobId: job.id,
      itemId,
      hasFoto: Boolean(foto),
      hasAudio: Boolean(audio),
    });
    return;
  }

  try {
    const [audioBuffer, photoBuffer] = await Promise.all([
      loadMidiaBytes(audio),
      loadMidiaBytes(foto),
    ]);

    const audioMime = guessMimeType(audio);
    const photoMime = guessMimeType(foto);

    const router = new AIRouter();

    // Stage 1 — STT
    const stt = await router.transcribeAudio(audioBuffer, audioMime);
    const transcript = stt.data;

    console.info("[ai-describe-item] STT done", {
      jobId: job.id,
      itemId,
      provider: stt.meta.provider,
      latencyMs: stt.meta.latencyMs,
      usedFallback: stt.meta.usedFallback,
    });

    await prisma.midia.update({
      where: { id: audio.id },
      data: { transcricao: transcript },
    });

    // Stage 2 — multimodal description (router downscales photo to 1024)
    const desc = await router.generateDescription(
      photoBuffer,
      photoMime,
      transcript,
    );

    console.info("[ai-describe-item] description done", {
      jobId: job.id,
      itemId,
      provider: desc.meta.provider,
      latencyMs: desc.meta.latencyMs,
      usedFallback: desc.meta.usedFallback,
      guardrailHit: desc.meta.guardrailHit,
    });

    const technicalDescription = desc.data.technicalDescription;
    const estadoConservacao = mapItemStateToPrisma(desc.data.itemState);

    await prisma.analiseIa.create({
      data: {
        itemId,
        provedor: desc.meta.provider,
        input: {
          transcript,
          photoKey: foto.key,
          photoMidiaId: foto.id,
          audioMidiaId: audio.id,
          promptsVersion: PROMPTS_VERSION,
          sttProvider: stt.meta.provider,
          sttLatencyMs: stt.meta.latencyMs,
        },
        output: desc.data,
        analise: technicalDescription,
        latencyMs: desc.meta.latencyMs,
        usedFallback: desc.meta.usedFallback,
        guardrailHit: desc.meta.guardrailHit,
        stage: "full",
      },
    });

    await prisma.item.update({
      where: { id: itemId },
      data: {
        descricao: technicalDescription,
        descricaoFinal: technicalDescription,
        estadoConservacao,
        status: "ANALISADO",
        analisadoEm: new Date(),
        descricaoEditada: false,
      },
    });

    console.info("[ai-describe-item] success", {
      jobId: job.id,
      itemId,
      status: "ANALISADO",
    });
  } catch (error) {
    if (error instanceof UnrecoverableError) {
      throw error;
    }

    const maxAttempts = job.opts.attempts ?? 3;
    const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

    if (isFinalAttempt) {
      // Exhausted BullMQ retries — leave item recoverable for manual reprocess (D-07)
      console.error(
        "[ai-describe-item] final failure — resetting item to CAPTURADO",
        {
          jobId: job.id,
          itemId,
          attempts: maxAttempts,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      try {
        await prisma.item.update({
          where: { id: itemId },
          data: { status: "CAPTURADO" },
        });
      } catch (resetErr) {
        console.error(
          "[ai-describe-item] failed to reset status after final failure",
          resetErr instanceof Error ? resetErr.message : resetErr,
        );
      }
    } else {
      console.warn("[ai-describe-item] provider failure — will retry", {
        jobId: job.id,
        itemId,
        attempt: job.attemptsMade + 1,
        maxAttempts,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Rethrow so BullMQ applies backoff / marks failed
    throw error;
  }
}
