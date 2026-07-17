import { NextRequest, NextResponse } from "next/server";
import { StatusRelatorio, TipoUsuario } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/vistorias/[id]/marcar-enviado
 * Marks report as sent (WhatsApp manual flow) — Phase 4 D-06.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: vistoriaId } = await params;

    const vistoria = await prisma.vistoria.findUnique({
      where: { id: vistoriaId },
      select: {
        id: true,
        empresaId: true,
        usuarioId: true,
        relatorio: { select: { id: true, status: true, enviadoEm: true } },
      },
    });

    if (!vistoria) {
      return NextResponse.json({ error: "Vistoria não encontrada" }, { status: 404 });
    }

    if (vistoria.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const isAdmin = session.user.role === TipoUsuario.ADMIN;
    const isAssigned =
      session.user.role === TipoUsuario.VISTORIADOR &&
      vistoria.usuarioId === session.user.id;
    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (!vistoria.relatorio) {
      return NextResponse.json(
        { error: "Gere o relatório fotográfico antes de marcar como enviado" },
        { status: 400 },
      );
    }

    const updated = await prisma.relatorio.update({
      where: { id: vistoria.relatorio.id },
      data: {
        enviadoEm: vistoria.relatorio.enviadoEm ?? new Date(),
        status:
          vistoria.relatorio.status === StatusRelatorio.CONFIRMADO ||
          vistoria.relatorio.status === StatusRelatorio.VISUALIZADO
            ? vistoria.relatorio.status
            : StatusRelatorio.ENVIADO,
      },
    });

    return NextResponse.json({
      success: true,
      enviadoEm: updated.enviadoEm?.toISOString(),
      status: updated.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("marcar-enviado:", error);
    return NextResponse.json(
      { error: "Erro ao marcar envio", details: message },
      { status: 500 },
    );
  }
}
