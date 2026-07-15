import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EstadoConservacao, StatusItem, TipoUsuario } from "@prisma/client";
import { z } from "zod";
import { containsRegulatedTerms } from "@/lib/ai/guardrails";

const patchBodySchema = z.object({
  descricaoFinal: z.string().min(1, "Descrição é obrigatória"),
  estadoConservacao: z
    .enum(["NOVO", "BOM", "REGULAR", "RUIM"])
    .optional(),
  approve: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: vistoriaId, itemId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { descricaoFinal, estadoConservacao, approve } = parsed.data;

    if (containsRegulatedTerms(descricaoFinal)) {
      return NextResponse.json(
        {
          error:
            'Não use termos regulados (ex.: "laudo", "perícia"). Prefira "relatório fotográfico" ou "documentação técnica".',
          code: "REGULATED_TERM",
        },
        { status: 400 },
      );
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        ambiente: {
          select: {
            vistoriaId: true,
            vistoria: {
              select: {
                empresaId: true,
                usuarioId: true,
              },
            },
          },
        },
      },
    });

    if (!item || !item.ambiente || item.ambiente.vistoriaId !== vistoriaId) {
      return NextResponse.json(
        { error: "Item não encontrado nesta vistoria" },
        { status: 404 },
      );
    }

    const role = session.user?.role;
    const empresaId = session.user?.empresaId;
    const userId = session.user?.id;
    const vistoria = item.ambiente.vistoria;

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

    const baseline = (item.descricao ?? "").trim();
    const finalText = descricaoFinal.trim();
    // approve without changes → descricaoEditada false; any text diff → true
    const descricaoEditada =
      approve === true && finalText === baseline
        ? false
        : finalText !== baseline;

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        descricaoFinal: finalText,
        descricaoEditada,
        status: StatusItem.REVISADO,
        ...(estadoConservacao
          ? {
              estadoConservacao:
                estadoConservacao as EstadoConservacao,
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        status: true,
        descricao: true,
        descricaoFinal: true,
        descricaoEditada: true,
        estadoConservacao: true,
        analisadoEm: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro ao salvar descrição:", error);
    return NextResponse.json(
      { error: "Erro ao salvar revisão da descrição", details: message },
      { status: 500 },
    );
  }
}
