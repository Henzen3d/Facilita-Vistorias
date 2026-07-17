import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { TipoUsuario } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/contestacoes — list contestations for empresa (Phase 4).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== TipoUsuario.ADMIN) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = session.user.empresaId;
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não definida" }, { status: 400 });
    }

    const list = await prisma.contestacao.findMany({
      where: {
        item: {
          ambiente: {
            vistoria: { empresaId },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        item: {
          select: {
            id: true,
            nome: true,
            ambiente: {
              select: {
                nome: true,
                vistoria: {
                  select: {
                    id: true,
                    codigo: true,
                    imovel: {
                      select: {
                        endereco: true,
                        numero: true,
                        bairro: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      contestacoes: list.map((c) => ({
        id: c.id,
        status: c.status,
        motivo: c.motivo,
        nomeCliente: c.nomeCliente,
        resposta: c.resposta,
        createdAt: c.createdAt.toISOString(),
        resolvidoEm: c.resolvidoEm?.toISOString() ?? null,
        item: {
          id: c.item.id,
          nome: c.item.nome,
          ambiente: c.item.ambiente.nome,
        },
        vistoria: {
          id: c.item.ambiente.vistoria.id,
          codigo: c.item.ambiente.vistoria.codigo,
          imovel: c.item.ambiente.vistoria.imovel,
        },
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("admin contestacoes GET:", error);
    return NextResponse.json(
      { error: "Erro ao listar contestações", details: message },
      { status: 500 },
    );
  }
}
