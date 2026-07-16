import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/admin/dashboard - KPIs gerais
export async function GET(_request: NextRequest) {
  try {
    const hoje = new Date();
    const seteDiasDepois = new Date();
    seteDiasDepois.setDate(hoje.getDate() + 7);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // 1. Vistorias concluídas no mês
    const concluidasNoMes = await prisma.vistoria.count({
      where: {
        status: "FINALIZADA", // No enum StatusVistoria, FINALIZADA representa a conclusão
        updatedAt: {
          gte: inicioMes,
        },
      },
    });

    // 2. Vistorias agendadas nos próximos 7 dias
    const agendadasProximos7Dias = await prisma.vistoria.count({
      where: {
        status: "AGENDADA",
        data: {
          gte: hoje,
          lte: seteDiasDepois,
        },
      },
    });

    // 3. Distribuição de status das vistorias
    const distribuicaoStatusRaw = await prisma.vistoria.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const distribuicaoStatus = distribuicaoStatusRaw.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    // 4. Métrica de aceitação da IA (% itens sem alteração manual)
    const totalItensComIa = await prisma.item.count({
      where: {
        analisesIa: {
          some: {}, // Se possui qualquer análise de IA associada
        },
      },
    });

    const itensSemEdicao = await prisma.item.count({
      where: {
        descricaoEditada: false,
        analisesIa: {
          some: {},
        },
      },
    });

    const taxaAceitacaoIa = totalItensComIa > 0 
      ? Math.round((itensSemEdicao / totalItensComIa) * 100) 
      : 100; // Default 100% se não houver itens

    // 5. Relatórios aguardando confirmação do cliente (Visualizados mas não Confirmados)
    const aguardandoConfirmacao = await prisma.relatorio.count({
      where: {
        status: "VISUALIZADO",
      },
    });

    // 6. Taxa de contestação (itens com contestação pendente/aceita em relação às finalizadas)
    const totalVistoriasFinalizadas = await prisma.vistoria.count({
      where: {
        status: "FINALIZADA",
      },
    });

    const vistoriasContestadas = await prisma.vistoria.count({
      where: {
        status: "FINALIZADA",
        ambientes: {
          some: {
            items: {
              some: {
                contestacoes: {
                  some: {},
                },
              },
            },
          },
        },
      },
    });

    const taxaContestacao = totalVistoriasFinalizadas > 0
      ? Number(((vistoriasContestadas / totalVistoriasFinalizadas) * 100).toFixed(1))
      : 0;

    // 7. Tempo médio de entrega em dias
    const relatoriosComTempo = await prisma.relatorio.findMany({
      where: {
        status: "CONFIRMADO",
      },
      select: {
        geradoEm: true,
        vistoria: {
          select: {
            data: true, // Data programada/realização
          },
        },
      },
    });

    let tempoMedioEntregaDias = 0;
    if (relatoriosComTempo.length > 0) {
      const somaDiferencasMs = relatoriosComTempo.reduce((acc, curr) => {
        const dataVistoria = new Date(curr.vistoria.data).getTime();
        const dataGeracao = new Date(curr.geradoEm).getTime();
        return acc + (dataGeracao - dataVistoria);
      }, 0);

      const mediaMs = somaDiferencasMs / relatoriosComTempo.length;
      tempoMedioEntregaDias = Number((mediaMs / (1000 * 60 * 60 * 24)).toFixed(1));
    }

    return NextResponse.json({
      kpis: {
        concluidasNoMes,
        agendadasProximos7Dias,
        taxaAceitacaoIa,
        aguardandoConfirmacao,
        taxaContestacao,
        tempoMedioEntregaDias,
      },
      distribuicaoStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao gerar métricas do dashboard", details: error.message },
      { status: 500 }
    );
  }
}
