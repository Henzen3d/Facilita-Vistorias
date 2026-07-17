import { NextRequest, NextResponse } from "next/server";
import { StatusContestacao } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rejectIfAssinado } from "@/lib/report/hard-lock";
import { verifyPublicReportToken } from "@/lib/report/token";
import { isContestacaoOpen } from "@/lib/report/whatsapp";

const bodySchema = z.object({
  itemId: z.string().min(1),
  nomeCliente: z.string().min(2).max(120),
  motivo: z.string().min(10).max(2000),
});

/**
 * POST /api/public/relatorio/[token]/contestar
 * Public contestation of a single report item (Phase 4).
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

    const locked = await rejectIfAssinado(verified.vistoriaId);
    if (locked) return locked;

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { itemId, nomeCliente, motivo } = parsed.data;

    const vistoria = await prisma.vistoria.findUnique({
      where: { id: verified.vistoriaId },
      select: {
        id: true,
        relatorio: {
          select: {
            enviadoEm: true,
            geradoEm: true,
            confirmadoEm: true,
          },
        },
      },
    });
    if (!vistoria) {
      return NextResponse.json({ error: "Vistoria não encontrada" }, { status: 404 });
    }

    if (vistoria.relatorio?.confirmadoEm) {
      return NextResponse.json(
        { error: "Relatório já confirmado — contestações encerradas" },
        { status: 400 },
      );
    }

    if (
      !isContestacaoOpen(
        vistoria.relatorio?.enviadoEm,
        vistoria.relatorio?.geradoEm,
      )
    ) {
      return NextResponse.json(
        { error: "Prazo para contestar este relatório encerrou" },
        { status: 400 },
      );
    }

    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        ambiente: { vistoriaId: vistoria.id },
      },
      select: {
        id: true,
        contestacoes: {
          where: {
            status: {
              in: [StatusContestacao.PENDENTE, StatusContestacao.EM_ANALISE],
            },
          },
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado neste relatório" },
        { status: 404 },
      );
    }

    if (item.contestacoes.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma contestação em andamento para este item" },
        { status: 409 },
      );
    }

    const contestacao = await prisma.contestacao.create({
      data: {
        itemId: item.id,
        nomeCliente: nomeCliente.trim(),
        motivo: motivo.trim(),
        status: StatusContestacao.PENDENTE,
      },
    });

    return NextResponse.json({ success: true, contestacao }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("contestar public:", error);
    return NextResponse.json(
      { error: "Erro ao registrar contestação", details: message },
      { status: 500 },
    );
  }
}
