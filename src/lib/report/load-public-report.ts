import { TipoMidia } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPublicReportToken } from "./token";

export type PublicReportPessoa = {
  nome: string;
  tipo: string;
};

export type PublicReportFoto = {
  id: string;
  url: string;
};

export type PublicReportItem = {
  id: string;
  nome: string;
  descricaoFinal: string | null;
  estadoConservacao: string | null;
  fotos: PublicReportFoto[];
};

export type PublicReportAmbiente = {
  id: string;
  nome: string;
  ordem: number;
  items: PublicReportItem[];
};

export type PublicReportGeracao = {
  versionNumber: number;
  userId: string | null;
  userNome: string | null;
  motivo: string | null;
  createdAt: string;
  pdfStorageKey: string | null;
};

export type PublicReportDto = {
  vistoria: {
    id: string;
    codigo: string;
    tipo: string;
    data: string;
    status: string;
  };
  empresa: { nome: string };
  imovel: {
    endereco: string;
    numero: string | null;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
  };
  /** nome + tipo only — no documento/CPF (T-03-19) */
  pessoas: PublicReportPessoa[];
  /** Items with full media only (D-11) */
  ambientes: PublicReportAmbiente[];
  /** Utility meter readings (Phase 3.2); null if none recorded */
  medidores: {
    aguaNumero: string | null;
    aguaLeitura: string | null;
    energiaNumero: string | null;
    energiaLeitura: string | null;
    gasNumero: string | null;
    gasLeitura: string | null;
    observacoes: string | null;
  } | null;
  relatorio: {
    status: string;
    geradoEm: string | null;
    pdfStorageKey: string | null;
    /** App-relative or absolute download path when PDF exists */
    pdfDownloadUrl: string | null;
    urlPublica: string | null;
    versaoAtual: number;
    historicoGeracoes: PublicReportGeracao[];
  } | null;
  token: string;
};

function itemHasFullMedia(
  midias: { tipo: TipoMidia }[],
): boolean {
  const hasFoto = midias.some((m) => m.tipo === TipoMidia.FOTO);
  const hasAudio = midias.some((m) => m.tipo === TipoMidia.AUDIO);
  return hasFoto && hasAudio;
}

function parseHistorico(raw: unknown): PublicReportGeracao[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const e = entry as Record<string, unknown>;
    return {
      versionNumber: Number(e.versionNumber ?? 0),
      userId: (e.userId as string | null) ?? null,
      userNome: (e.userNome as string | null) ?? null,
      motivo: (e.motivo as string | null) ?? null,
      createdAt:
        typeof e.createdAt === "string"
          ? e.createdAt
          : new Date().toISOString(),
      pdfStorageKey: (e.pdfStorageKey as string | null) ?? null,
    };
  });
}

/**
 * Loads public report DTO by opaque token.
 * Omits items without full media (foto+áudio) per D-11.
 * Exposes only safe fields (no CPF/documento).
 */
export async function loadPublicReportByToken(
  token: string,
): Promise<PublicReportDto | null> {
  const verified = await verifyPublicReportToken(token);
  if (!verified) return null;

  const vistoria = await prisma.vistoria.findUnique({
    where: { id: verified.vistoriaId },
    select: {
      id: true,
      codigo: true,
      tipo: true,
      data: true,
      status: true,
      tokenPublico: true,
      empresa: { select: { nome: true } },
      imovel: {
        select: {
          endereco: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
          pessoas: {
            select: { nome: true, tipo: true },
          },
        },
      },
      medidores: {
        select: {
          aguaNumero: true,
          aguaLeitura: true,
          energiaNumero: true,
          energiaLeitura: true,
          gasNumero: true,
          gasLeitura: true,
          observacoes: true,
        },
      },
      relatorio: {
        select: {
          status: true,
          geradoEm: true,
          pdfStorageKey: true,
          urlPublica: true,
          versaoAtual: true,
          historicoGeracoes: true,
        },
      },
      ambientes: {
        orderBy: { ordem: "asc" },
        select: {
          id: true,
          nome: true,
          ordem: true,
          items: {
            orderBy: { nome: "asc" },
            select: {
              id: true,
              nome: true,
              descricaoFinal: true,
              descricao: true,
              estadoConservacao: true,
              midias: {
                select: {
                  id: true,
                  tipo: true,
                  url: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!vistoria) return null;

  const ambientes: PublicReportAmbiente[] = [];
  for (const ambiente of vistoria.ambientes) {
    const items: PublicReportItem[] = [];
    for (const item of ambiente.items) {
      // D-11: only items with complete media (foto + áudio)
      if (!itemHasFullMedia(item.midias)) continue;

      const fotos = item.midias
        .filter((m) => m.tipo === TipoMidia.FOTO)
        .map((m) => ({ id: m.id, url: m.url }));

      items.push({
        id: item.id,
        nome: item.nome,
        descricaoFinal: item.descricaoFinal ?? item.descricao,
        estadoConservacao: item.estadoConservacao,
        fotos,
      });
    }
    if (items.length > 0) {
      ambientes.push({
        id: ambiente.id,
        nome: ambiente.nome,
        ordem: ambiente.ordem,
        items,
      });
    }
  }

  const rel = vistoria.relatorio;
  let pdfDownloadUrl: string | null = null;
  if (rel?.pdfStorageKey) {
    // Local public fallback used by worker when storage upload fails/unavailable
    if (rel.pdfStorageKey.startsWith("local:")) {
      pdfDownloadUrl = rel.pdfStorageKey.replace(/^local:/, "");
    } else {
      // Authenticated-less download via public API (token-gated)
      pdfDownloadUrl = `/api/public/relatorio/${token}/pdf`;
    }
  }

  const med = vistoria.medidores;

  return {
    vistoria: {
      id: vistoria.id,
      codigo: vistoria.codigo,
      tipo: vistoria.tipo,
      data: vistoria.data.toISOString(),
      status: vistoria.status,
    },
    empresa: { nome: vistoria.empresa.nome },
    imovel: {
      endereco: vistoria.imovel.endereco,
      numero: vistoria.imovel.numero,
      complemento: vistoria.imovel.complemento,
      bairro: vistoria.imovel.bairro,
      cidade: vistoria.imovel.cidade,
      estado: vistoria.imovel.estado,
    },
    pessoas: vistoria.imovel.pessoas.map((p) => ({
      nome: p.nome,
      tipo: p.tipo,
    })),
    ambientes,
    medidores: med
      ? {
          aguaNumero: med.aguaNumero,
          aguaLeitura: med.aguaLeitura,
          energiaNumero: med.energiaNumero,
          energiaLeitura: med.energiaLeitura,
          gasNumero: med.gasNumero,
          gasLeitura: med.gasLeitura,
          observacoes: med.observacoes,
        }
      : null,
    relatorio: rel
      ? {
          status: rel.status,
          geradoEm: rel.geradoEm?.toISOString() ?? null,
          pdfStorageKey: rel.pdfStorageKey,
          pdfDownloadUrl,
          urlPublica: rel.urlPublica,
          versaoAtual: rel.versaoAtual,
          historicoGeracoes: parseHistorico(rel.historicoGeracoes),
        }
      : null,
    token,
  };
}

/** Shared helper: item has both FOTO and AUDIO midias. */
export function hasFullMedia(midias: { tipo: string }[]): boolean {
  return (
    midias.some((m) => m.tipo === "FOTO") &&
    midias.some((m) => m.tipo === "AUDIO")
  );
}
