import { StatusRelatorio } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const HARD_LOCK_MESSAGE =
  "Relatório assinado eletronicamente — edições bloqueadas (HTTP 423).";

/**
 * Returns true when the vistoria's report is ASSINADA (Phase 5 D-05 hard lock).
 */
export async function isRelatorioAssinado(
  vistoriaId: string,
): Promise<boolean> {
  const rel = await prisma.relatorio.findUnique({
    where: { vistoriaId },
    select: { status: true, assinadoEm: true },
  });
  if (!rel) return false;
  return (
    rel.status === StatusRelatorio.ASSINADA || rel.assinadoEm != null
  );
}

/** JSON 423 Locked response for mutation routes. */
export function hardLockResponse(): NextResponse {
  return NextResponse.json(
    {
      error: HARD_LOCK_MESSAGE,
      code: "RELATORIO_ASSINADO",
      locked: true,
    },
    { status: 423 },
  );
}

/**
 * If signed, returns the 423 response; otherwise null (caller proceeds).
 */
export async function rejectIfAssinado(
  vistoriaId: string,
): Promise<NextResponse | null> {
  if (await isRelatorioAssinado(vistoriaId)) {
    return hardLockResponse();
  }
  return null;
}
