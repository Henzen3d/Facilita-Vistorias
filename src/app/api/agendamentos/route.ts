import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TipoUsuario, StatusVistoria } from "@prisma/client"

// GET /api/agendamentos - Listar agendamentos (vistorias)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = { empresaId: session.user.empresaId }
    if (status) where.status = status
    if (session.user.role === TipoUsuario.VISTORIADOR) {
      where.usuarioId = session.user.id
    }

    const [vistorias, total] = await Promise.all([
      prisma.vistoria.findMany({
        where,
        include: {
          imovel: { select: { endereco: true, numero: true, bairro: true, cidade: true } },
          usuario: { select: { nome: true } },
          _count: { select: { ambientes: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { data: "asc" },
      }),
      prisma.vistoria.count({ where }),
    ])

    return NextResponse.json({ vistorias, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao listar agendamentos", details: error.message }, { status: 500 })
  }
}

// POST /api/agendamentos - Criar agendamento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()

    // Gerar código único
    const codigo = `VIST-${Date.now()}`

    const vistoria = await prisma.vistoria.create({
      data: {
        codigo,
        tipo: body.tipo,
        data: new Date(body.data),
        imovelId: body.imovelId,
        empresaId: session.user.empresaId!,
        usuarioId: body.usuarioId || session.user.id!,
        status: StatusVistoria.AGENDADA,
      },
      include: { imovel: true, usuario: { select: { nome: true } } },
    })

    return NextResponse.json(vistoria, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao criar agendamento", details: error.message }, { status: 500 })
  }
}

// PUT /api/agendamentos - Atualizar vistoria
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    if (data.data) data.data = new Date(data.data)

    const vistoria = await prisma.vistoria.update({
      where: { id },
      data,
      include: { imovel: true },
    })

    return NextResponse.json(vistoria)
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar vistoria", details: error.message }, { status: 500 })
  }
}

// DELETE /api/agendamentos?id=xxx - Deletar vistoria
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    await prisma.vistoria.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao deletar vistoria", details: error.message }, { status: 500 })
  }
}