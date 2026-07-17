import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { StatusItem, StatusVistoria, TipoMidia, TipoUsuario } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueueGeneratePdf } from "@/lib/queue/queues";
import { rejectIfAssinado } from "@/lib/report/hard-lock";
import { createPublicReportToken } from "@/lib/report/token";

const bodySchema = z.object({
  motivo: z.string().max(500).optional(),
});

function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function hasFullMedia(midias: { tipo: TipoMidia }[]): boolean {
  return (
    midias.some((m) => m.tipo === TipoMidia.FOTO) &&
    midias.some((m) => m.tipo === TipoMidia.AUDIO)
  );
}

/**
 * POST /api/vistorias/[id]/finalizar
 * D-15: admin (same empresa) OR assigned vistoriador.
 * D-16: hard gate — all items with full media must be REVISADO/FINALIZADO.
 * Creates public token if needed, enqueues PDF generation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: vistoriaId } = await params;

    const locked = await rejectIfAssinado(vistoriaId);
    if (locked) return locked;

    let motivo: string | undefined;
    try {
      const raw = await request.json();
      const parsed = bodySchema.safeParse(raw);
      if (parsed.success) motivo = parsed.data.motivo;
    } catch {
      // empty body is fine
    }

    const vistoria = await prisma.vistoria.findUnique({
      where: { id: vistoriaId },
      select: {
        id: true,
        empresaId: true,
        usuarioId: true,
        status: true,
        tokenPublico: true,
        expiracaoToken: true,
        relatorio: {
          select: { id: true, versaoAtual: true },
        },
        ambientes: {
          select: {
            items: {
              select: {
                id: true,
                nome: true,
                status: true,
                midias: { select: { tipo: true } },
              },
            },
          },
        },
      },
    });

    if (!vistoria) {
      return NextResponse.json(
        { error: "Vistoria não encontrada" },
        { status: 404 },
      );
    }

    const role = session.user.role;
    const empresaId = session.user.empresaId;
    const userId = session.user.id;

    if (!empresaId || vistoria.empresaId !== empresaId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const isAdmin = role === TipoUsuario.ADMIN;
    const isAssignedVistoriador =
      role === TipoUsuario.VISTORIADOR &&
      !!userId &&
      vistoria.usuarioId === userId;

    if (!isAdmin && !isAssignedVistoriador) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // D-16: only items with complete media (foto+áudio) must be reviewed
    const mediaItems = vistoria.ambientes.flatMap((a) =>
      a.items.filter((it) => hasFullMedia(it.midias)),
    );

    if (mediaItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum item com mídia completa (foto + áudio) para gerar o relatório fotográfico",
          code: "NO_MEDIA_ITEMS",
        },
        { status: 400 },
      );
    }

    const pending = mediaItems.filter(
      (it) =>
        it.status !== StatusItem.REVISADO &&
        it.status !== StatusItem.FINALIZADO,
    );

    if (pending.length > 0) {
      return NextResponse.json(
        {
          error:
            "Ainda há itens com mídia pendentes de revisão humana antes de finalizar",
          code: "REVIEW_INCOMPLETE",
          pending: pending.map((p) => ({ id: p.id, nome: p.nome, status: p.status })),
        },
        { status: 400 },
      );
    }

    // Token: create if missing or expired (D-17: expiry is null in MVP)
    let token = vistoria.tokenPublico;
    const expired =
      !!vistoria.expiracaoToken && vistoria.expiracaoToken <= new Date();
    if (!token || expired) {
      const created = await createPublicReportToken(vistoriaId);
      token = created.token;
    }

    // Keep EM_REVISAO until PDF processor sets FINALIZADA (unless already FINALIZADA regenerating)
    if (vistoria.status !== StatusVistoria.FINALIZADA) {
      await prisma.vistoria.update({
        where: { id: vistoriaId },
        data: { status: StatusVistoria.EM_REVISAO },
      });
    }

    const isRegen = !!vistoria.relatorio;
    await enqueueGeneratePdf({
      vistoriaId,
      requestedByUserId: userId,
      motivo:
        motivo ??
        (isRegen
          ? "Regeneração manual do PDF"
          : "Geração inicial após revisão"),
    });

    const urlPublica = `${appBaseUrl()}/public/r/${token}`;

    return NextResponse.json(
      {
        ok: true,
        tokenPublico: token,
        urlPublica,
        pdfQueued: true,
        regenerating: isRegen,
      },
      { status: 202 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro ao finalizar vistoria:", error);
    return NextResponse.json(
      { error: "Erro ao finalizar e enfileirar PDF", details: message },
      { status: 500 },
    );
  }
}
