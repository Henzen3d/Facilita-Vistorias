import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusItem, TipoUsuario } from "@prisma/client";

/**
 * Authorization: ADMIN of same empresaId OR VISTORIADOR assigned to the vistoria.
 * Returns true if allowed, false if forbidden; null if vistoria not found.
 */
async function authorizeVistoriaAccess(
  vistoriaId: string,
  session: {
    user?: { id?: string; role?: TipoUsuario; empresaId?: string };
  },
) {
  const vistoria = await prisma.vistoria.findUnique({
    where: { id: vistoriaId },
    select: {
      id: true,
      codigo: true,
      tipo: true,
      status: true,
      data: true,
      empresaId: true,
      usuarioId: true,
      tokenPublico: true,
      imovel: {
        select: {
          endereco: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
        },
      },
      usuario: {
        select: { id: true, nome: true },
      },
      checklistChegada: true,
      relatorio: {
        select: {
          status: true,
          geradoEm: true,
          urlPublica: true,
          pdfStorageKey: true,
          versaoAtual: true,
          historicoGeracoes: true,
        },
      },
      ambientes: {
        orderBy: { ordem: "asc" },
        include: {
          items: {
            orderBy: { nome: "asc" },
            include: {
              midias: {
                select: {
                  id: true,
                  tipo: true,
                  url: true,
                  transcricao: true,
                },
              },
              analisesIa: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  provedor: true,
                  analise: true,
                  usedFallback: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!vistoria) return { error: "not_found" as const };

  const role = session.user?.role;
  const empresaId = session.user?.empresaId;
  const userId = session.user?.id;

  if (!empresaId || vistoria.empresaId !== empresaId) {
    return { error: "forbidden" as const };
  }

  if (role === TipoUsuario.ADMIN) {
    return { vistoria };
  }

  if (role === TipoUsuario.VISTORIADOR && userId && vistoria.usuarioId === userId) {
    return { vistoria };
  }

  return { error: "forbidden" as const };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const result = await authorizeVistoriaAccess(id, session);

    if ("error" in result && result.error === "not_found") {
      return NextResponse.json({ error: "Vistoria não encontrada" }, { status: 404 });
    }
    if ("error" in result && result.error === "forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { vistoria } = result;

    let total = 0;
    let analisados = 0;
    let revisados = 0;
    let pendentes = 0;

    const ambientes = vistoria.ambientes.map((ambiente) => ({
      id: ambiente.id,
      nome: ambiente.nome,
      ordem: ambiente.ordem,
      items: ambiente.items.map((item) => {
        total += 1;
        if (item.status === StatusItem.REVISADO || item.status === StatusItem.FINALIZADO) {
          revisados += 1;
        } else if (
          item.status === StatusItem.ANALISADO ||
          item.status === StatusItem.EM_ANALISE
        ) {
          analisados += 1;
        } else {
          pendentes += 1;
        }

        const latestAnalise = item.analisesIa[0] ?? null;

        return {
          id: item.id,
          nome: item.nome,
          status: item.status,
          descricao: item.descricao,
          descricaoFinal: item.descricaoFinal,
          descricaoEditada: item.descricaoEditada,
          estadoConservacao: item.estadoConservacao,
          analisadoEm: item.analisadoEm,
          midias: item.midias.map((m) => ({
            id: m.id,
            tipo: m.tipo,
            url: m.url,
            transcricao: m.transcricao,
          })),
          analise: latestAnalise
            ? {
                provedor: latestAnalise.provedor,
                analise: latestAnalise.analise,
                usedFallback: latestAnalise.usedFallback,
                createdAt: latestAnalise.createdAt,
              }
            : null,
        };
      }),
    }));

    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const urlPublica = vistoria.tokenPublico
      ? `${appUrl}/public/r/${vistoria.tokenPublico}`
      : vistoria.relatorio?.urlPublica ?? null;

    const historicoRaw = vistoria.relatorio?.historicoGeracoes;
    const historicoGeracoes = Array.isArray(historicoRaw) ? historicoRaw : [];

    return NextResponse.json({
      vistoria: {
        id: vistoria.id,
        codigo: vistoria.codigo,
        tipo: vistoria.tipo,
        status: vistoria.status,
        data: vistoria.data,
        tokenPublico: vistoria.tokenPublico,
      },
      imovel: vistoria.imovel,
      vistoriador: vistoria.usuario,
      ambientes,
      progress: { total, analisados, revisados, pendentes },
      checklistChegada: vistoria.checklistChegada,
      // D-19: regen history visible to admin and vistoriador
      relatorio: vistoria.relatorio
        ? {
            status: vistoria.relatorio.status,
            geradoEm: vistoria.relatorio.geradoEm,
            urlPublica,
            pdfStorageKey: vistoria.relatorio.pdfStorageKey,
            versaoAtual: vistoria.relatorio.versaoAtual,
            historicoGeracoes,
          }
        : null,
      urlPublica,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro ao carregar revisão:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados de revisão", details: message },
      { status: 500 },
    );
  }
}
