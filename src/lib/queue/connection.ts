import type { ConnectionOptions } from "bullmq";

const DEFAULT_REDIS_URL = "redis://127.0.0.1:6379";

/**
 * BullMQ connection options derived from REDIS_URL.
 * Defaults to local Redis for host-side development.
 */
export function getRedisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL || DEFAULT_REDIS_URL;
  const parsed = new URL(url);

  const db =
    parsed.pathname && parsed.pathname.length > 1
      ? Number(parsed.pathname.slice(1))
      : 0;

  return {
    host: parsed.hostname || "127.0.0.1",
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isFinite(db) ? db : 0,
    maxRetriesPerRequest: null, // required by BullMQ workers
  };
}
