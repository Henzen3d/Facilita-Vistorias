import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TipoUsuario } from "@prisma/client";

// GET /api/vistorias - Retorna vistorias com árvore de dados completa para offline-first
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const where: any = {
      empresaId: session.user.empresaId,
    };

    // Vistoriador só vê suas próprias vistorias
    if (session.user.role === TipoUsuario.VISTORIADOR) {
      where.usuarioId = session.user.id;
    }

    // Buscar vistorias com imovel, pessoas, ambientes e itens completos
    const vistorias = await prisma.vistoria.findMany({
      where,
      include: {
        imovel: {
          include: {
            pessoas: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        ambientes: {
          orderBy: {
            ordem: "asc",
          },
          include: {
            items: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        checklistChegada: true,
      },
      orderBy: {
        data: "asc",
      },
    });

    return NextResponse.json(vistorias);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao carregar dados de pré-carregamento", details: error.message },
      { status: 500 }
    );
  }
}
