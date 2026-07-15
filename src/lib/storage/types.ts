/**
 * S3-compatible object storage contract (MinIO local or Cloudflare R2).
 * Implementations must read credentials only from env — never hard-code keys.
 */
export interface StorageProvider {
  /** Upload bytes and return a public or app-relative URL string. */
  upload(key: string, file: Buffer, contentType: string): Promise<string>;
  /** Temporary signed URL for private objects. Default TTL: 3600s. */
  getSignedUrl(key: string, expiresInSec?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
