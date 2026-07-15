import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { TipoUsuario } from "@prisma/client"

const imovelSchema = z.object({
  endereco: z.string().min(3),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  cep: z.string().length(8),
  empresaId: z.string().uuid(),
})

// GET /api/imoveis - Listar imóveis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const where = {
      empresaId: session.user.empresaId,
      ...(search ? { endereco: { contains: search, mode: "insensitive" as const } } : {}),
    }

    const [imoveis, total] = await Promise.all([
      prisma.imovel.findMany({
        where,
        include: { pessoas: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.imovel.count({ where }),
    ])

    return NextResponse.json({ imoveis, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao listar imóveis", details: error.message }, { status: 500 })
  }
}

// POST /api/imoveis - Criar imóvel (admin apenas)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role !== TipoUsuario.ADMIN) {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const body = await request.json()
    const data = imovelSchema.parse(body)

    const imovel = await prisma.imovel.create({ data })
    return NextResponse.json(imovel, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao criar imóvel", details: error.message }, { status: 500 })
  }
}

// PUT /api/imoveis - Atualizar imóvel (admin apenas)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role !== TipoUsuario.ADMIN) {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    const imovel = await prisma.imovel.update({ where: { id }, data })
    return NextResponse.json(imovel)
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar imóvel", details: error.message }, { status: 500 })
  }
}

// DELETE /api/imoveis - Deletar imóvel (admin apenas)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role !== TipoUsuario.ADMIN) {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    await prisma.imovel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao deletar imóvel", details: error.message }, { status: 500 })
  }
}