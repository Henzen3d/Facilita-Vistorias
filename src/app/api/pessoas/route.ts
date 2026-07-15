import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { TipoUsuario } from "@prisma/client"

const pessoaSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  documento: z.string().optional(),
  tipo: z.enum(["LOCADOR", "LOCATARIO", "PROPRIETARIO", "FIADOR"]),
  imovelId: z.string().uuid(),
})

// GET /api/pessoas - Listar pessoas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    const where: any = {
      imovel: { empresaId: session.user.empresaId },
      ...(tipo ? { tipo: tipo as any } : {}),
      ...(search ? { nome: { contains: search, mode: "insensitive" } } : {}),
    }

    const [pessoas, total] = await Promise.all([
      prisma.pessoa.findMany({
        where,
        include: { imovel: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nome: "asc" },
      }),
      prisma.pessoa.count({ where }),
    ])

    return NextResponse.json({ pessoas, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao listar pessoas", details: error.message }, { status: 500 })
  }
}

// POST /api/pessoas - Criar pessoa (admin apenas)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role !== TipoUsuario.ADMIN) {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const body = await request.json()
    const data = pessoaSchema.parse(body)

    const pessoa = await prisma.pessoa.create({ data })
    return NextResponse.json(pessoa, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao criar pessoa", details: error.message }, { status: 500 })
  }
}

// DELETE /api/pessoas?id=xxx - Deletar pessoa
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

    await prisma.pessoa.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao deletar pessoa", details: error.message }, { status: 500 })
  }
}

// PUT /api/pessoas - Atualizar pessoa
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

    const pessoa = await prisma.pessoa.update({ where: { id }, data })
    return NextResponse.json(pessoa)
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar pessoa", details: error.message }, { status: 500 })
  }
}