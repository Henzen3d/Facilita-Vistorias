import { NextRequest, NextResponse } from "next/server";
import { StatusRelatorio } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPublicReportToken } from "@/lib/report/token";

const bodySchema = z.object({
  nome: z.string().min(2).max(120),
});

/**
 * POST /api/public/relatorio/[token]/confirmar
 * Client confirms receipt of the photographic report (Phase 4).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const verified = await verifyPublicReportToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: "Link inválido ou relatório não encontrado" },
        { status: 404 },
      );
    }

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Informe o nome completo de quem confirma" },
        { status: 400 },
      );
    }

    const rel = await prisma.relatorio.findUnique({
      where: { vistoriaId: verified.vistoriaId },
    });
    if (!rel) {
      return NextResponse.json(
        { error: "Relatório ainda não gerado" },
        { status: 404 },
      );
    }

    if (rel.confirmadoEm) {
      return NextResponse.json({
        success: true,
        already: true,
        confirmadoEm: rel.confirmadoEm.toISOString(),
        nomeQuemConfirmou: rel.nomeQuemConfirmou,
      });
    }

    const updated = await prisma.relatorio.update({
      where: { id: rel.id },
      data: {
        confirmadoEm: new Date(),
        nomeQuemConfirmou: parsed.data.nome.trim(),
        status: StatusRelatorio.CONFIRMADO,
      },
    });

    return NextResponse.json({
      success: true,
      confirmadoEm: updated.confirmadoEm?.toISOString(),
      nomeQuemConfirmou: updated.nomeQuemConfirmou,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("confirmar public:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar recebimento", details: message },
      { status: 500 },
    );
  }
}
