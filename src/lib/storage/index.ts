import path from "node:path";
import type { StorageProvider } from "./types";
import { S3StorageProvider } from "./s3";

export type { StorageProvider } from "./types";
export { S3StorageProvider } from "./s3";

let singleton: StorageProvider | null = null;

/** Factory: returns a process-wide StorageProvider (R2 or MinIO via STORAGE_PROVIDER). */
export function getStorageProvider(): StorageProvider {
  if (!singleton) {
    singleton = new S3StorageProvider();
  }
  return singleton;
}

/**
 * Maps app-relative midia URLs written by the current upload route
 * (`/uploads/...`) to an absolute filesystem path under `public/`.
 * Used by the worker until full S3 migration is complete.
 */
export function resolveLocalUploadPath(midiaUrl: string): string {
  if (!midiaUrl.startsWith("/uploads/")) {
    throw new Error(
      `resolveLocalUploadPath expects a /uploads/ URL, got: ${midiaUrl}`,
    );
  }
  // midiaUrl is app-relative, e.g. /uploads/item-id/foto.jpg
  return path.join(process.cwd(), "public", midiaUrl);
}
