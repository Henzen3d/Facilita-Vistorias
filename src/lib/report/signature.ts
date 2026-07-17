import { createHash } from "node:crypto";
import { StatusContestacao, StatusRelatorio } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * SHA-256 integrity hash for electronic signature (Phase 5 D-04).
 * Server-side only: relatórioId + token + ISO timestamp + nome.
 */
export function buildAssinaturaHash(input: {
  relatorioId: string;
  token: string;
  timestampIso: string;
  nomeCompleto: string;
}): string {
  const payload = [
    input.relatorioId,
    input.token,
    input.timestampIso,
    input.nomeCompleto.trim(),
  ].join("|");
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

/** Accept PNG data URL or raw base64; reject empty/non-PNG. */
export function isValidAssinaturaBase64(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < 100) return false;
  if (trimmed.startsWith("data:image/png;base64,")) {
    const b64 = trimmed.slice("data:image/png;base64,".length);
    return b64.length > 80 && /^[A-Za-z0-9+/=\s]+$/.test(b64);
  }
  // raw base64 PNG
  return trimmed.length > 80 && /^[A-Za-z0-9+/=\s]+$/.test(trimmed);
}

export function normalizeAssinaturaImage(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:image/png;base64,")) return trimmed;
  return `data:image/png;base64,${trimmed.replace(/\s/g, "")}`;
}

/** Client IP from proxy headers (Vercel/nginx) or connection. */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 45);
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 45);
  return "0.0.0.0";
}

export function summarizeUserAgent(ua: string | null): string {
  if (!ua) return "Desconhecido";
  return ua.slice(0, 255);
}

/**
 * Signature is allowed when status is CONFIRMADO and no open contestations.
 * (Phase 5 D-09)
 */
export async function canAssinarRelatorio(vistoriaId: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const rel = await prisma.relatorio.findUnique({
    where: { vistoriaId },
    select: {
      status: true,
      assinadoEm: true,
      confirmadoEm: true,
    },
  });

  if (!rel) {
    return { ok: false, reason: "Relatório ainda não gerado" };
  }
  if (rel.assinadoEm || rel.status === StatusRelatorio.ASSINADA) {
    return { ok: false, reason: "Documento já assinado" };
  }
  // Prefer status CONFIRMADO; allow confirmadoEm fallback if status lag
  const confirmado =
    rel.status === StatusRelatorio.CONFIRMADO || Boolean(rel.confirmadoEm);
  if (!confirmado) {
    return {
      ok: false,
      reason: "Confirme o recebimento do relatório antes de assinar",
    };
  }

  const openContest = await prisma.contestacao.count({
    where: {
      item: { ambiente: { vistoriaId } },
      status: {
        in: [StatusContestacao.PENDENTE, StatusContestacao.EM_ANALISE],
      },
    },
  });

  if (openContest > 0) {
    return {
      ok: false,
      reason:
        "Existem contestações em andamento. Aguarde a resolução antes de assinar.",
    };
  }

  return { ok: true };
}
