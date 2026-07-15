/**
 * BullMQ worker entrypoint — `npm run worker` / docker-compose worker service.
 * Consumes AI describe-item + PDF generation jobs.
 *
 * Requires: REDIS_URL + AI keys (GEMINI_API_KEY at minimum) + APP_URL for PDF.
 * Does not start the Next.js server (Puppeteer loads APP_URL/public/r/{token}?print=1).
 */
import { Worker } from "bullmq";
import { getRedisConnection } from "../src/lib/queue/connection";
import {
  QUEUE_AI_DESCRIBE,
  QUEUE_GENERATE_PDF,
} from "../src/lib/queue/jobs";
import { processAiDescribeItem } from "./processors/ai-describe-item";
import { processGeneratePdf } from "./processors/generate-pdf";

const connection = getRedisConnection();

const aiWorker = new Worker(QUEUE_AI_DESCRIBE, processAiDescribeItem, {
  connection,
  concurrency: 2,
});

/** Single concurrency for Puppeteer (T-03-22). */
const pdfWorker = new Worker(QUEUE_GENERATE_PDF, processGeneratePdf, {
  connection,
  concurrency: 1,
});

aiWorker.on("ready", () => {
  console.info("[worker] ready", {
    queue: QUEUE_AI_DESCRIBE,
    concurrency: 2,
  });
});

pdfWorker.on("ready", () => {
  console.info("[worker] ready", {
    queue: QUEUE_GENERATE_PDF,
    concurrency: 1,
  });
});

aiWorker.on("completed", (job) => {
  console.info("[worker] job completed", {
    queue: QUEUE_AI_DESCRIBE,
    jobId: job.id,
    itemId: job.data?.itemId,
  });
});

pdfWorker.on("completed", (job) => {
  console.info("[worker] job completed", {
    queue: QUEUE_GENERATE_PDF,
    jobId: job.id,
    vistoriaId: job.data?.vistoriaId,
  });
});

aiWorker.on("failed", (job, err) => {
  console.error("[worker] job failed", {
    queue: QUEUE_AI_DESCRIBE,
    jobId: job?.id,
    itemId: job?.data?.itemId,
    error: err?.message ?? String(err),
  });
});

pdfWorker.on("failed", (job, err) => {
  console.error("[worker] job failed", {
    queue: QUEUE_GENERATE_PDF,
    jobId: job?.id,
    vistoriaId: job?.data?.vistoriaId,
    error: err?.message ?? String(err),
  });
});

aiWorker.on("error", (err) => {
  console.error("[worker] AI worker error", err?.message ?? String(err));
});

pdfWorker.on("error", (err) => {
  console.error("[worker] PDF worker error", err?.message ?? String(err));
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`[worker] ${signal} received — closing gracefully`);
  try {
    await Promise.all([aiWorker.close(), pdfWorker.close()]);
  } catch (err) {
    console.error(
      "[worker] error during close",
      err instanceof Error ? err.message : err,
    );
  }
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
