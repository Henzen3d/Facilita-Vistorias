import { NextRequest, NextResponse } from "next/server";
import { StatusContestacao, TipoUsuario } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  status: z.enum(["ACEITA", "REJEITADA", "RESOLVIDA", "EM_ANALISE"]),
  resposta: z.string().max(2000).optional(),
});

/**
 * PATCH /api/admin/contestacoes/[id] — respond to contestation (Phase 4).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== TipoUsuario.ADMIN) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const existing = await prisma.contestacao.findFirst({
      where: {
        id,
        item: {
          ambiente: {
            vistoria: { empresaId: session.user.empresaId! },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contestação não encontrada" },
        { status: 404 },
      );
    }

    const nextStatus = parsed.data.status as StatusContestacao;
    const isTerminal =
      nextStatus === StatusContestacao.ACEITA ||
      nextStatus === StatusContestacao.REJEITADA ||
      nextStatus === StatusContestacao.RESOLVIDA;

    const updated = await prisma.contestacao.update({
      where: { id },
      data: {
        status: nextStatus,
        resposta: parsed.data.resposta?.trim() || existing.resposta,
        resolvidoEm: isTerminal ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      contestacao: {
        id: updated.id,
        status: updated.status,
        resposta: updated.resposta,
        resolvidoEm: updated.resolvidoEm?.toISOString() ?? null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("admin contestacoes PATCH:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar contestação", details: message },
      { status: 500 },
    );
  }
}
