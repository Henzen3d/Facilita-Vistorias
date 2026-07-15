/**
 * BullMQ worker entrypoint — `npm run worker` / docker-compose worker service.
 * Consumes AI describe-item jobs only (PDF processor registered in Plan 05).
 *
 * Requires: REDIS_URL + AI keys (GEMINI_API_KEY at minimum).
 * Does not start the Next.js server.
 */
import { Worker } from "bullmq";
import { getRedisConnection } from "../src/lib/queue/connection";
import { QUEUE_AI_DESCRIBE } from "../src/lib/queue/jobs";
// TODO(03-05): register QUEUE_GENERATE_PDF worker when PDF processor lands
import { processAiDescribeItem } from "./processors/ai-describe-item";

const connection = getRedisConnection();

const aiWorker = new Worker(QUEUE_AI_DESCRIBE, processAiDescribeItem, {
  connection,
  concurrency: 2,
});

aiWorker.on("ready", () => {
  console.info("[worker] ready", {
    queue: QUEUE_AI_DESCRIBE,
    concurrency: 2,
  });
});

aiWorker.on("completed", (job) => {
  console.info("[worker] job completed", {
    queue: QUEUE_AI_DESCRIBE,
    jobId: job.id,
    itemId: job.data?.itemId,
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

aiWorker.on("error", (err) => {
  console.error("[worker] worker error", err?.message ?? String(err));
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`[worker] ${signal} received — closing gracefully`);
  try {
    await aiWorker.close();
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
