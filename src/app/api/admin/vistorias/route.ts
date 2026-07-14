import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/admin/vistorias - Lista vistorias com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (status && status !== "Todos os Status") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { codigo: { contains: search, mode: "insensitive" } },
        { imovel: { endereco: { contains: search, mode: "insensitive" } } },
      ];
    }

    const vistorias = await prisma.vistoria.findMany({
      where: whereClause,
      include: {
        imovel: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        relatorio: true,
      },
      orderBy: {
        data: "desc",
      },
    });

    return NextResponse.json(vistorias);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar vistorias", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/vistorias - Agenda nova vistoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, data, imovelId, empresaId, usuarioId } = body;

    if (!tipo || !data || !imovelId || !empresaId || !usuarioId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }

    // Gerar um código único incremental ou randômico simples
    const codigo = `VIS-${Date.now().toString().slice(-6)}`;

    const novaVistoria = await prisma.vistoria.create({
      data: {
        codigo,
        tipo,
        data: new Date(data),
        status: "AGENDADA",
        imovelId,
        empresaId,
        usuarioId,
      },
      include: {
        imovel: true,
        usuario: true,
      },
    });

    return NextResponse.json(novaVistoria, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao criar agendamento", details: error.message },
      { status: 500 }
    );
  }
}
