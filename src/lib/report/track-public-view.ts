import { StatusRelatorio } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Records a public page view (not print mode). Best-effort; never throws to caller.
 */
export async function trackPublicReportView(vistoriaId: string): Promise<void> {
  try {
    const rel = await prisma.relatorio.findUnique({
      where: { vistoriaId },
      select: { id: true, status: true, visualizadoEm: true },
    });
    if (!rel) return;

    const nextStatus =
      rel.status === StatusRelatorio.GERADO ||
      rel.status === StatusRelatorio.ENVIADO
        ? StatusRelatorio.VISUALIZADO
        : rel.status;

    await prisma.relatorio.update({
      where: { id: rel.id },
      data: {
        totalVisualizacoes: { increment: 1 },
        visualizadoEm: rel.visualizadoEm ?? new Date(),
        status: nextStatus,
      },
    });
  } catch (err) {
    console.warn("trackPublicReportView failed", err);
  }
}
