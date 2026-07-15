"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
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
  };
  ambientes: Ambiente[];
  progress: {
    total: number;
    analisados: number;
    revisados: number;
    pendentes: number;
  };
};

function firstFotoUrl(midias: Midia[]): string | undefined {
  return midias.find((m) => m.tipo === "FOTO")?.url;
}

function audioTranscricao(midias: Midia[]): string | null {
  const audio = midias.find((m) => m.tipo === "AUDIO" && m.transcricao);
  return audio?.transcricao ?? null;
}

export default function FieldRevisaoIaPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [data, setData] = useState<ReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const load = useCallback(async () => {
    if (!navigator.onLine) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha ao carregar revisão");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, online]);

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
    <PhoneShell showNav={false}>
      <TopBar title="Revisar descrições" backTo={`/field/vistorias/${id}/sucesso`} />

      <main className="flex-1 px-5 pt-2 pb-8 space-y-4 overflow-y-auto">
        {!online && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-5 text-sm space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <Icon name="wifi_off" className="text-[18px]" />
              Sem conexão
            </p>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              A revisão de descrições técnicas requer conexão com a internet.
              As saídas da IA não ficam disponíveis offline.
            </p>
          </div>
        )}

        {online && loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Icon
              name="progress_activity"
              className="text-3xl text-primary animate-spin"
            />
            <span className="text-xs">Carregando descrições técnicas…</span>
          </div>
        )}

        {online && error && !loading && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-3xl p-5 text-sm space-y-2">
            <p className="font-bold">Não foi possível carregar</p>
            <p className="text-xs">{error}</p>
            <button
              type="button"
              onClick={load}
              className="text-primary font-bold text-xs hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {online && data && !loading && (
          <>
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Progresso do relatório fotográfico
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Revisados:{" "}
                  <strong className="text-secondary">
                    {data.progress.revisados}/{data.progress.total}
                  </strong>
                </span>
                <span className="text-slate-500">
                  Status:{" "}
                  <strong className="text-secondary">{data.vistoria.status}</strong>
                </span>
              </div>
              {allReviewed && (
                <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2">
                  Todas as descrições técnicas revisadas — pronto para o relatório
                  fotográfico (PDF na próxima etapa).
                </p>
              )}
            </div>

            {data.ambientes.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-8">
                Nenhum ambiente encontrado.
              </p>
            )}

            {data.ambientes.map((ambiente) => (
              <section key={ambiente.id} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  {ambiente.nome}
                </h3>
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
              </section>
            ))}
          </>
        )}

        <div className="pt-2">
          <Link
            href={`/field/vistorias/${id}/sucesso`}
            className="block w-full h-12 rounded-full bg-secondary text-white text-sm font-bold text-center leading-[3rem]"
          >
            Voltar
          </Link>
        </div>
      </main>
    </PhoneShell>
  );
}
