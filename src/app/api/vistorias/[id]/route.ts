import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import { StatusVistoria } from "@prisma/client";

function mapFieldStatusToVistoria(
  raw: string,
): StatusVistoria | "FORBIDDEN_FINALIZADA" | null {
  if (raw === "EM_REVISAO") return StatusVistoria.EM_REVISAO;
  // Legacy field value after capture complete → enter review (D-04)
  if (raw === "CONCLUIDA") return StatusVistoria.EM_REVISAO;
  // FINALIZADA is post-review only (Plan 05) — never via field path
  if (raw === "FINALIZADA") return "FORBIDDEN_FINALIZADA";
  if (raw === "EM_ANDAMENTO") return StatusVistoria.EM_ANDAMENTO;
  if (raw === "AGENDADA") return StatusVistoria.AGENDADA;
  if (raw === "CANCELADA") return StatusVistoria.CANCELADA;
  return null;
}

async function createAmbienteLocal(
  vistoriaId: string,
  raw: {
    id?: string;
    nome?: string;
    ordem?: number;
    createdAt?: string;
    updatedAt?: string;
  },
) {
  if (!raw?.nome || typeof raw.nome !== "string") {
    return NextResponse.json(
      { error: "Ambiente inválido: nome obrigatório" },
      { status: 400 },
    );
  }

  const vistoria = await prisma.vistoria.findUnique({
    where: { id: vistoriaId },
    select: { id: true },
  });
  if (!vistoria) {
    return NextResponse.json(
      { error: "Vistoria não encontrada" },
      { status: 404 },
    );
  }

  const id =
    typeof raw.id === "string" && raw.id.length > 0
      ? raw.id
      : undefined;

  const existing = id
    ? await prisma.ambiente.findUnique({ where: { id } })
    : null;
  if (existing) {
    return NextResponse.json({ success: true, ambiente: existing, deduped: true });
  }

  const maxOrdem = await prisma.ambiente.aggregate({
    where: { vistoriaId },
    _max: { ordem: true },
  });
  const ordem =
    typeof raw.ordem === "number" && raw.ordem > 0
      ? raw.ordem
      : (maxOrdem._max.ordem ?? 0) + 1;

  const ambiente = await prisma.ambiente.create({
    data: {
      ...(id ? { id } : {}),
      nome: raw.nome.trim(),
      ordem,
      vistoriaId,
    },
  });

  return NextResponse.json({ success: true, ambiente });
}

async function createItemLocal(
  vistoriaId: string,
  raw: {
    id?: string;
    nome?: string;
    ambienteId?: string;
    descricao?: string | null;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  },
) {
  if (!raw?.nome || typeof raw.nome !== "string") {
    return NextResponse.json(
      { error: "Item inválido: nome obrigatório" },
      { status: 400 },
    );
  }
  if (!raw?.ambienteId || typeof raw.ambienteId !== "string") {
    return NextResponse.json(
      { error: "Item inválido: ambienteId obrigatório" },
      { status: 400 },
    );
  }

  const ambiente = await prisma.ambiente.findFirst({
    where: { id: raw.ambienteId, vistoriaId },
  });
  if (!ambiente) {
    return NextResponse.json(
      {
        error:
          "Ambiente não encontrado nesta vistoria (sincronize o cômodo antes do item)",
      },
      { status: 404 },
    );
  }

  const id =
    typeof raw.id === "string" && raw.id.length > 0 ? raw.id : undefined;
  if (id) {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (existing) {
      return NextResponse.json({ success: true, item: existing, deduped: true });
    }
  }

  const item = await prisma.item.create({
    data: {
      ...(id ? { id } : {}),
      nome: raw.nome.trim(),
      descricao: raw.descricao ?? null,
      ambienteId: raw.ambienteId,
      status: "PENDENTE",
    },
  });

  return NextResponse.json({ success: true, item });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: vistoriaId } = resolvedParams;

    const body = await request.json();
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Legacy mis-queued creates under UPDATE_VISTORIA_STATUS (before Phase 3.1)
    if (
      action === "UPDATE_VISTORIA_STATUS" &&
      payload?.tipo === "CREATE_AMBIENTE"
    ) {
      const raw = payload?.ambiente ?? payload;
      return createAmbienteLocal(vistoriaId, raw);
    }

    // Dedicated status-only action (T-03-18) — NEVER reuse UPDATE_CHECKLIST for status
    if (
      action === "UPDATE_VISTORIA_STATUS" ||
      action === "FINALIZAR_CAMPO"
    ) {
      const rawStatus =
        typeof payload.status === "string" ? payload.status : "";
      const mapped = mapFieldStatusToVistoria(rawStatus);

      if (mapped === "FORBIDDEN_FINALIZADA") {
        return NextResponse.json(
          {
            error:
              "FINALIZADA só é permitida após revisão e finalize de relatório",
          },
          { status: 400 },
        );
      }

      if (!mapped) {
        return NextResponse.json(
          { error: `Status de vistoria inválido: ${rawStatus}` },
          { status: 400 },
        );
      }

      const vistoria = await prisma.vistoria.update({
        where: { id: vistoriaId },
        data: { status: mapped },
      });

      return NextResponse.json({ success: true, vistoria });
    }

    if (action === "UPDATE_CHECKLIST") {
      const {
        cheiroGasOk,
        luzesLigadas,
        janelasAbertas,
        arCondicionadoLigado,
        aguaQuenteLigada,
        descargasTestadas,
        chuveirosTestados,
        disjuntoresChecados,
        interfoneTestado,
        portaoGaragemTestado,
        outrosItens,
      } = payload;

      // Checklist boolean fields only — never read payload.status for vistoria
      const checklist = await prisma.checklistChegada.upsert({
        where: { vistoriaId },
        update: {
          cheiroGasOk,
          luzesLigadas,
          janelasAbertas,
          arCondicionadoLigado,
          aguaQuenteLigada,
          descargasTestadas,
          chuveirosTestados,
          disjuntoresChecados,
          interfoneTestado,
          portaoGaragemTestado,
          outrosItens,
        },
        create: {
          vistoriaId,
          cheiroGasOk,
          luzesLigadas,
          janelasAbertas,
          arCondicionadoLigado,
          aguaQuenteLigada,
          descargasTestadas,
          chuveirosTestados,
          disjuntoresChecados,
          interfoneTestado,
          portaoGaragemTestado,
          outrosItens,
        },
      });

      return NextResponse.json({ success: true, checklist });
    }

    if (action === "UPDATE_ITEM_STATUS") {
      // Legacy field payloads sometimes nested create under this action
      if (payload?.tipo === "CREATE_ITEM" && payload?.item) {
        const raw = payload.item;
        return createItemLocal(vistoriaId, raw);
      }

      const { id: itemId, status, descricao } = payload;

      const existing = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          ambiente: { select: { vistoriaId: true } },
        },
      });

      if (
        !existing ||
        !existing.ambiente ||
        existing.ambiente.vistoriaId !== vistoriaId
      ) {
        return NextResponse.json(
          { error: "Item não encontrado nesta vistoria" },
          { status: 404 },
        );
      }

      const item = await prisma.item.update({
        where: { id: itemId },
        data: {
          status,
          descricao,
        },
      });

      return NextResponse.json({ success: true, item });
    }

    // Phase 3.1 — create room/item from field offline queue
    if (action === "CREATE_AMBIENTE_LOCAL") {
      const raw = payload?.ambiente ?? payload;
      return createAmbienteLocal(vistoriaId, raw);
    }

    if (action === "CREATE_ITEM_LOCAL") {
      const raw = payload?.item ?? payload;
      return createItemLocal(vistoriaId, raw);
    }

    if (action === "DELETE_MIDIA") {
      const { id: midiaId } = payload;

      const midia = await prisma.midia.findUnique({
        where: { id: midiaId },
        include: {
          item: {
            include: {
              ambiente: { select: { vistoriaId: true } },
            },
          },
        },
      });

      if (midia) {
        if (midia.item.ambiente.vistoriaId !== vistoriaId) {
          return NextResponse.json(
            { error: "Mídia não pertence a esta vistoria" },
            { status: 404 },
          );
        }

        await prisma.midia.delete({
          where: { id: midiaId },
        });

        try {
          const filePath = path.join(process.cwd(), "public", midia.url);
          await fs.unlink(filePath);
        } catch (e) {
          console.warn(`Erro ao excluir arquivo físico: ${midia.url}`, e);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro ao processar sincronização:", error);
    return NextResponse.json(
      {
        error: "Erro interno ao processar sincronização",
        details: message,
      },
      { status: 500 },
    );
  }
}
