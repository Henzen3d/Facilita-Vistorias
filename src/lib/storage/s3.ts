import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "./types";

const DEFAULT_SIGNED_URL_TTL_SEC = 3600;

type StorageBackend = "r2" | "minio";

function resolveBackend(): StorageBackend {
  const raw = (process.env.STORAGE_PROVIDER ?? "r2").toLowerCase();
  return raw === "minio" ? "minio" : "r2";
}

function createS3Client(backend: StorageBackend): { client: S3Client; bucket: string } {
  if (backend === "minio") {
    const endpoint = process.env.MINIO_ENDPOINT;
    if (!endpoint) {
      throw new Error("MINIO_ENDPOINT is required when STORAGE_PROVIDER=minio");
    }
    return {
      client: new S3Client({
        endpoint,
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
          secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
        },
        forcePathStyle: true,
      }),
      bucket: process.env.STORAGE_BUCKET || "vistorias",
    };
  }

  // Default: Cloudflare R2
  const endpoint = process.env.R2_ENDPOINT;
  if (!endpoint) {
    throw new Error("R2_ENDPOINT is required when STORAGE_PROVIDER=r2");
  }
  return {
    client: new S3Client({
      endpoint,
      region: "auto",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    }),
    bucket: process.env.STORAGE_BUCKET || "app-facilita",
  };
}

function publicUrlForKey(backend: StorageBackend, bucket: string, key: string): string {
  if (backend === "r2" && process.env.R2_PUBLIC_BASE_URL) {
    return `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }
  // App-relative fallback used until CDN/public base is configured
  return `/storage/${bucket}/${key}`;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly backend: StorageBackend;

  constructor() {
    this.backend = resolveBackend();
    const { client, bucket } = createS3Client(this.backend);
    this.client = client;
    this.bucket = bucket;
  }

  async upload(key: string, file: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      }),
    );
    return publicUrlForKey(this.backend, this.bucket, key);
  }

  async getSignedUrl(key: string, expiresInSec: number = DEFAULT_SIGNED_URL_TTL_SEC): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return presign(this.client, command, { expiresIn: expiresInSec });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
