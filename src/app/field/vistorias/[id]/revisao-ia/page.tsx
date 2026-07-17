"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  const [finalizingPdf, setFinalizingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<{
    urlPublica?: string;
    message?: string;
  } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
  const reviewPct =
    data && data.progress.total > 0
      ? Math.round((data.progress.revisados / data.progress.total) * 100)
      : 0;

  const handleFinalizePdf = async () => {
    if (!online || !allReviewed || finalizingPdf) return;
    setFinalizingPdf(true);
    setPdfError(null);
    setPdfResult(null);
    try {
      const res = await fetch(`/api/vistorias/${id}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: "Finalização do relatório fotográfico pelo vistoriador (campo)",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          body?.error ||
            (body?.code === "REVIEW_INCOMPLETE"
              ? "Ainda há itens com mídia incompleta de revisão"
              : `Erro ${res.status}`),
        );
      }
      setPdfResult({
        urlPublica: body.urlPublica as string | undefined,
        message:
          "Relatório enfileirado. O PDF fica disponível no link público em instantes.",
      });
      await load();
    } catch (e: unknown) {
      setPdfError(
        e instanceof Error ? e.message : "Falha ao gerar relatório fotográfico",
      );
    } finally {
      setFinalizingPdf(false);
    }
  };

  return (
    <PhoneShell showNav={false}>
      <TopBar title="Revisar descrições" backTo={`/field/vistorias/${id}/sucesso`} />

      <main className="flex-1 px-5 pt-2 pb-8 space-y-4 overflow-y-auto">
        {!online && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-5 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-sm">
              <Icon name="wifi_off" className="text-[20px]" />
              Sem conexão
            </p>
            <p className="text-sm text-amber-800/90 leading-relaxed">
              A revisão de descrições técnicas precisa de internet. As saídas da IA não
              ficam disponíveis offline.
            </p>
          </div>
        )}

        {online && loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Icon name="progress_activity" className="text-3xl text-primary animate-spin" />
            <span className="text-sm">Carregando descrições técnicas…</span>
          </div>
        )}

        {online && error && !loading && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-3xl p-5 space-y-3">
            <p className="font-bold text-sm">Não foi possível carregar</p>
            <p className="text-sm">{error}</p>
            <Button type="button" size="sm" onClick={load}>
              Tentar novamente
            </Button>
          </div>
        )}

        {online && data && !loading && (
          <>
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Relatório fotográfico
                  </p>
                  <p className="text-sm font-bold text-secondary mt-0.5">
                    {data.vistoria.codigo}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {data.progress.revisados}/{data.progress.total}
                </span>
              </div>
              <Progress
                value={reviewPct}
                size="sm"
                barClassName={allReviewed ? "bg-status-good" : "bg-primary"}
                label="Revisados"
                meta={`${reviewPct}%`}
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <Metric label="Analisados" value={data.progress.analisados} />
                <Metric label="Revisados" value={data.progress.revisados} good />
                <Metric label="Pendentes" value={data.progress.pendentes} warn />
              </div>
              {allReviewed && (
                <div className="space-y-3">
                  <p className="text-sm text-status-good bg-green-50 border border-status-good/20 rounded-2xl px-3 py-2 font-medium">
                    Todas as descrições revisadas — você pode gerar o relatório
                    fotográfico em PDF.
                  </p>
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    disabled={finalizingPdf || !online}
                    onClick={handleFinalizePdf}
                    className="shadow-lg shadow-primary/20"
                  >
                    {finalizingPdf ? (
                      <>
                        <Icon
                          name="progress_activity"
                          className="text-[20px] animate-spin"
                        />
                        Gerando…
                      </>
                    ) : (
                      <>
                        <Icon name="picture_as_pdf" className="text-[20px]" />
                        Gerar relatório PDF
                      </>
                    )}
                  </Button>
                  {pdfError && (
                    <p
                      className="text-xs text-status-bad bg-red-50 border border-status-bad/20 rounded-2xl px-3 py-2"
                      role="alert"
                    >
                      {pdfError}
                    </p>
                  )}
                  {pdfResult && (
                    <div className="text-xs text-status-good bg-green-50 border border-status-good/20 rounded-2xl px-3 py-2 space-y-1">
                      <p className="font-semibold">{pdfResult.message}</p>
                      {pdfResult.urlPublica && (
                        <a
                          href={pdfResult.urlPublica}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-primary underline break-all"
                        >
                          Abrir versão digital
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {data.ambientes.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">
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
            className="flex items-center justify-center w-full h-12 min-h-[48px] rounded-full bg-secondary text-white text-sm font-bold hover:bg-secondary/90 transition-colors"
          >
            Voltar
          </Link>
        </div>
      </main>
    </PhoneShell>
  );
}

function Metric({
  label,
  value,
  good,
  warn,
}: {
  label: string;
  value: number;
  good?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 py-2 px-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`text-base font-bold tabular-nums mt-0.5 ${
          good ? "text-status-good" : warn ? "text-status-warn" : "text-secondary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
