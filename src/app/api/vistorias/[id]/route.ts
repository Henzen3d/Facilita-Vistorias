import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

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

      // Update or create ChecklistChegada
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
      const { id: itemId, status, descricao } = payload;

      const item = await prisma.item.update({
        where: { id: itemId },
        data: {
          status,
          descricao,
        },
      });

      return NextResponse.json({ success: true, item });
    }

    if (action === "DELETE_MIDIA") {
      const { id: midiaId, key } = payload;

      // Find midia
      const midia = await prisma.midia.findUnique({
        where: { id: midiaId }
      });

      if (midia) {
        // Delete from database
        await prisma.midia.delete({
          where: { id: midiaId }
        });

        // Try deleting local file
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
  } catch (error: any) {
    console.error("Erro ao processar sincronização:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar sincronização", details: error.message },
      { status: 500 }
    );
  }
}
