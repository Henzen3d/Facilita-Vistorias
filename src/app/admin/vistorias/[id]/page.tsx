"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/app/Icon";
import { ItemDescricaoEditor } from "@/components/report/ItemDescricaoEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Midia = {
  id: string;
  tipo: string;
  url: string;
  transcricao?: string | null;
};

type ReviewItem = {
  id: string;
  nome: string;
  status: string;
  descricao: string | null;
  descricaoFinal: string | null;
  descricaoEditada: boolean;
  estadoConservacao: string | null;
  analisadoEm: string | null;
  midias: Midia[];
  analise: {
    provedor: string;
    analise: string;
    usedFallback: boolean;
    createdAt: string;
  } | null;
};

type Ambiente = {
  id: string;
  nome: string;
  ordem: number;
  items: ReviewItem[];
};

type ReviewPayload = {
  vistoria: {
    id: string;
    codigo: string;
    tipo: string;
    status: string;
    data: string;
  };
  imovel: {
    endereco: string;
    numero: string | null;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
  };
  vistoriador: { id: string; nome: string };
  ambientes: Ambiente[];
  progress: {
    total: number;
    analisados: number;
    revisados: number;
    pendentes: number;
  };
  checklistChegada: Record<string, unknown> | null;
};

function firstFotoUrl(midias: Midia[]): string | undefined {
  return midias.find((m) => m.tipo === "FOTO")?.url;
}

function audioTranscricao(midias: Midia[]): string | null {
  const audio = midias.find((m) => m.tipo === "AUDIO" && m.transcricao);
  return audio?.transcricao ?? null;
}

function formatEndereco(imovel: ReviewPayload["imovel"]): string {
  const parts = [
    imovel.endereco,
    imovel.numero,
    imovel.complemento,
    imovel.bairro,
    `${imovel.cidade}/${imovel.estado}`,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function AdminVistoriaDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [data, setData] = useState<ReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAmbientes, setOpenAmbientes] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vistorias/${id}/revisao`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Erro ${res.status}`);
      }
      const payload = (await res.json()) as ReviewPayload;
      setData(payload);
      const open: Record<string, boolean> = {};
      for (const a of payload.ambientes) open[a.id] = true;
      setOpenAmbientes(open);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha ao carregar revisão");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleItemSaved = (
    ambienteId: string,
    itemId: string,
    updated: {
      id: string;
      status: string;
      descricaoFinal: string | null;
      descricaoEditada: boolean;
      estadoConservacao: string | null;
    },
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      const ambientes = prev.ambientes.map((a) => {
        if (a.id !== ambienteId) return a;
        return {
          ...a,
          items: a.items.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  status: updated.status,
                  descricaoFinal: updated.descricaoFinal,
                  descricaoEditada: updated.descricaoEditada,
                  estadoConservacao: updated.estadoConservacao,
                }
              : it,
          ),
        };
      });

      let revisados = 0;
      let analisados = 0;
      let pendentes = 0;
      let total = 0;
      for (const a of ambientes) {
        for (const it of a.items) {
          total += 1;
          if (it.status === "REVISADO" || it.status === "FINALIZADO") revisados += 1;
          else if (it.status === "ANALISADO" || it.status === "EM_ANALISE")
            analisados += 1;
          else pendentes += 1;
        }
      }

      return {
        ...prev,
        ambientes,
        progress: { total, analisados, revisados, pendentes },
      };
    });
  };

  const allReviewed =
    !!data && data.progress.total > 0 && data.progress.revisados === data.progress.total;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Relatório fotográfico
            {data ? ` — ${data.vistoria.codigo}` : ""}
          </h1>
          <p className="text-sm text-slate-500">
            Revisão das descrições técnicas geradas pela IA, ambiente por ambiente
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/vistorias"
            className="text-slate-500 text-sm hover:underline font-medium flex items-center"
          >
            Voltar
          </Link>
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
          >
            <Icon name="refresh" className="text-[18px]" />
            Atualizar
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Icon name="progress_activity" className="text-3xl animate-spin text-[#00AEEF]" />
          <span className="text-sm">Carregando revisão…</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-6 space-y-3">
          <p className="font-semibold">Não foi possível carregar a vistoria</p>
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={load}
            className="text-sm font-bold text-[#00AEEF] hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {allReviewed && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900 text-sm font-medium">
                Todas as descrições revisadas — pronto para gerar o relatório
                fotográfico
                <span className="block text-xs font-normal text-emerald-700 mt-1">
                  A geração do PDF será liberada na próxima etapa.
                </span>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">Total</span>
                <p className="font-bold text-lg">{data.progress.total}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">
                  Analisados
                </span>
                <p className="font-bold text-lg text-indigo-600">
                  {data.progress.analisados}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">
                  Revisados
                </span>
                <p className="font-bold text-lg text-emerald-600">
                  {data.progress.revisados}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">
                  Pendentes
                </span>
                <p className="font-bold text-lg text-amber-600">
                  {data.progress.pendentes}
                </p>
              </div>
            </div>

            {data.ambientes.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 text-sm">
                Nenhum ambiente cadastrado nesta vistoria.
              </div>
            )}

            {data.ambientes.map((ambiente) => {
              const open = openAmbientes[ambiente.id] ?? true;
              const revisadosAmb = ambiente.items.filter(
                (i) => i.status === "REVISADO" || i.status === "FINALIZADO",
              ).length;
              return (
                <div
                  key={ambiente.id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                >
                  <button
                    type="button"
                    className="w-full text-left flex items-center justify-between"
                    onClick={() =>
                      setOpenAmbientes((s) => ({
                        ...s,
                        [ambiente.id]: !open,
                      }))
                    }
                  >
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Icon
                        name={open ? "expand_more" : "chevron_right"}
                        className="text-[22px] text-slate-400"
                      />
                      {ambiente.nome}
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                      {revisadosAmb}/{ambiente.items.length} revisados
                    </span>
                  </button>

                  {open && (
                    <div className="mt-4 space-y-4">
                      {ambiente.items.length === 0 && (
                        <p className="text-xs text-slate-400">Sem itens neste ambiente.</p>
                      )}
                      {ambiente.items.map((item) => {
                        const baseline =
                          item.descricaoFinal ??
                          item.descricao ??
                          item.analise?.analise ??
                          "";
                        return (
                          <ItemDescricaoEditor
                            key={item.id}
                            vistoriaId={data.vistoria.id}
                            itemId={item.id}
                            nome={item.nome}
                            fotoUrl={firstFotoUrl(item.midias)}
                            descricaoFinal={baseline}
                            estadoConservacao={item.estadoConservacao}
                            status={item.status}
                            provedor={item.analise?.provedor}
                            transcricao={audioTranscricao(item.midias)}
                            onSaved={(updated) =>
                              handleItemSaved(ambiente.id, item.id, updated)
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Informações do Imóvel</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong className="font-semibold text-slate-500">Endereço:</strong>{" "}
                  {formatEndereco(data.imovel)}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">Código:</strong>{" "}
                  {data.vistoria.codigo}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">Tipo:</strong>{" "}
                  {data.vistoria.tipo}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">Status:</strong>{" "}
                  {data.vistoria.status}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">Vistoriador:</strong>{" "}
                  {data.vistoriador.nome}
                </p>
              </div>
            </div>

            {data.checklistChegada && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Protocolo de Chegada</h3>
                <div className="space-y-2 text-xs">
                  {(
                    [
                      ["cheiroGasOk", "Cheiro de Gás OK"],
                      ["luzesLigadas", "Luzes Ligadas"],
                      ["janelasAbertas", "Janelas Abertas"],
                      ["arCondicionadoLigado", "Ar-Condicionado"],
                      ["aguaQuenteLigada", "Água Quente"],
                      ["descargasTestadas", "Descargas"],
                      ["chuveirosTestados", "Chuveiros"],
                      ["disjuntoresChecados", "Disjuntores"],
                      ["interfoneTestado", "Interfone"],
                      ["portaoGaragemTestado", "Portão Garagem"],
                    ] as const
                  ).map(([key, label]) => {
                    const ok = Boolean(
                      (data.checklistChegada as Record<string, unknown>)[key],
                    );
                    return (
                      <div
                        key={key}
                        className="flex justify-between py-1 border-b border-slate-50"
                      >
                        <span>{label}</span>
                        <span
                          className={
                            ok
                              ? "text-emerald-600 font-bold"
                              : "text-slate-400 font-medium"
                          }
                        >
                          {ok ? "✓ OK" : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
