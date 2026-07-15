import sharp from "sharp";

const DEFAULT_MAX_EDGE = 1024;

/**
 * Downscale image so the longest edge is ≤ maxEdge (default 1024).
 * Outputs JPEG quality ~80 for vision providers (bandwidth/token savings).
 * If already within bounds, still returns a valid re-encoded buffer.
 */
export async function downscaleImageBuffer(
  buffer: Buffer,
  mimeType: string,
  maxEdge = DEFAULT_MAX_EDGE
): Promise<{ buffer: Buffer; mimeType: string }> {
  const image = sharp(buffer, { failOn: "none" });
  const metadata = await image.metadata();
  const width = metadata.width ?? maxEdge;
  const height = metadata.height ?? maxEdge;
  const longest = Math.max(width, height);

  let pipeline = image;
  if (longest > maxEdge) {
    pipeline = pipeline.resize({
      width: width >= height ? maxEdge : undefined,
      height: height > width ? maxEdge : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Prefer JPEG for multimodal APIs (smaller payload). Keep PNG only if input is PNG
  // and we did not need to resize — still re-encode as JPEG for consistent provider MIME.
  const output = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return {
    buffer: output,
    mimeType: "image/jpeg",
  };
}
