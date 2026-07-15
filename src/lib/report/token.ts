import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export type PublicReportTokenResult = {
  token: string;
  /** D-17: null = no expiry in MVP */
  expiresAt: Date | null;
};

/**
 * Creates an opaque UUID public token and persists it on Vistoria.
 * URL path uses Vistoria.tokenPublico (revocable by setting null).
 * D-17: no expiry in MVP — expiracaoToken is always null.
 */
export async function createPublicReportToken(
  vistoriaId: string,
): Promise<PublicReportTokenResult> {
  const token = randomUUID();
  const expiresAt: Date | null = null;

  await prisma.vistoria.update({
    where: { id: vistoriaId },
    data: {
      tokenPublico: token,
      expiracaoToken: expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Verifies a public report token via DB lookup on tokenPublico.
 * Valid when token matches and (expiracaoToken is null OR > now).
 */
export async function verifyPublicReportToken(
  token: string,
): Promise<{ vistoriaId: string } | null> {
  if (!token || typeof token !== "string") return null;

  const now = new Date();
  const vistoria = await prisma.vistoria.findFirst({
    where: {
      tokenPublico: token,
      OR: [{ expiracaoToken: null }, { expiracaoToken: { gt: now } }],
    },
    select: { id: true },
  });

  return vistoria ? { vistoriaId: vistoria.id } : null;
}
