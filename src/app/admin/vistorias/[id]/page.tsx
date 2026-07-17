"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
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

type HistoricoGeracao = {
  versionNumber?: number;
  userId?: string | null;
  userNome?: string | null;
  motivo?: string | null;
  createdAt?: string;
  pdfStorageKey?: string | null;
};

type ReviewPayload = {
  vistoria: {
    id: string;
    codigo: string;
    tipo: string;
    status: string;
    data: string;
    tokenPublico?: string | null;
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
  urlPublica?: string | null;
  relatorio?: {
    status: string;
    geradoEm: string | null;
    urlPublica: string | null;
    pdfStorageKey: string | null;
    versaoAtual: number;
    historicoGeracoes: HistoricoGeracao[];
  } | null;
};

function firstFotoUrl(midias: Midia[]): string | undefined {
  return midias.find((m) => m.tipo === "FOTO")?.url;
}

function audioTranscricao(midias: Midia[]): string | null {
  const audio = midias.find((m) => m.tipo === "AUDIO" && m.transcricao);
  return audio?.transcricao ?? null;
}

function hasFullMedia(midias: Midia[]): boolean {
  return (
    midias.some((m) => m.tipo === "FOTO") &&
    midias.some((m) => m.tipo === "AUDIO")
  );
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

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export default function AdminVistoriaDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [data, setData] = useState<ReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAmbientes, setOpenAmbientes] = useState<Record<string, boolean>>(
    {},
  );
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenMotivo, setRegenMotivo] = useState("");

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
      if (payload.urlPublica) setPublicUrl(payload.urlPublica);
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
          if (it.status === "REVISADO" || it.status === "FINALIZADO")
            revisados += 1;
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

  /** D-16: gate on items with full media only */
  const mediaItems = useMemo(() => {
    if (!data) return [];
    return data.ambientes.flatMap((a) =>
      a.items.filter((it) => hasFullMedia(it.midias)),
    );
  }, [data]);

  const mediaReviewed = mediaItems.filter(
    (it) => it.status === "REVISADO" || it.status === "FINALIZADO",
  ).length;

  const canFinalize =
    mediaItems.length > 0 && mediaReviewed === mediaItems.length;

  const hasExistingReport = !!data?.relatorio;

  const handleFinalize = async () => {
    setFinalizing(true);
    setFinalizeError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/vistorias/${id}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: hasExistingReport
            ? regenMotivo.trim() || "Regeneração manual do PDF"
            : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const pending = Array.isArray(body?.pending)
          ? ` (${body.pending.map((p: { nome: string }) => p.nome).join(", ")})`
          : "";
        throw new Error((body?.error || `Erro ${res.status}`) + pending);
      }
      if (body.urlPublica) setPublicUrl(body.urlPublica as string);
      await load();
    } catch (e: unknown) {
      setFinalizeError(
        e instanceof Error ? e.message : "Falha ao finalizar relatório",
      );
    } finally {
      setFinalizing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const [markingSent, setMarkingSent] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  const whatsappUrl = publicUrl
    ? (() => {
        const endereco = data?.imovel
          ? `${data.imovel.endereco}${data.imovel.numero ? `, ${data.imovel.numero}` : ""}`
          : undefined;
        const lines = [
          `Olá! Segue o *relatório fotográfico* da vistoria ${data?.vistoria.codigo || ""}.`,
        ];
        if (endereco) lines.push(`Imóvel: ${endereco}`);
        lines.push("", "Acesse a versão digital e o PDF:", publicUrl, "");
        lines.push(
          "Se notar alguma divergência em um item, use a opção Contestar no link.",
        );
        const text = encodeURIComponent(lines.join("\n"));
        return `https://wa.me/?text=${text}`;
      })()
    : null;

  const handleMarkSent = async () => {
    setMarkingSent(true);
    setSentMsg(null);
    try {
      const res = await fetch(`/api/vistorias/${id}/marcar-enviado`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Erro ${res.status}`);
      setSentMsg("Marcado como enviado.");
      await load();
    } catch (e) {
      setSentMsg(e instanceof Error ? e.message : "Falha ao marcar envio");
    } finally {
      setMarkingSent(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light font-sans text-secondary p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
            Admin · revisão IA
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-secondary">
            Relatório fotográfico
            {data ? ` — ${data.vistoria.codigo}` : ""}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Revise descrições técnicas ambiente por ambiente antes de gerar o PDF
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/vistorias"
            className="text-slate-500 text-sm hover:underline font-medium flex items-center min-h-[44px]"
          >
            Voltar
          </Link>
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <Icon name="refresh" className="text-[18px]" />
            Atualizar
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Icon
            name="progress_activity"
            className="text-3xl animate-spin text-primary"
          />
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
            className="text-sm font-bold text-primary hover:underline min-h-[44px]"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {canFinalize && (
              <div className="rounded-2xl border border-status-good/30 bg-green-50 px-5 py-4 text-green-900 text-sm font-medium">
                Itens com mídia revisados ({mediaReviewed}/{mediaItems.length}) —
                pronto para{" "}
                {hasExistingReport ? "regenerar" : "gerar"} o relatório
                fotográfico
              </div>
            )}

            {!canFinalize && mediaItems.length > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
                Revise todos os itens com foto e áudio antes de finalizar (
                {mediaReviewed}/{mediaItems.length} revisados).
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Total
                </span>
                <p className="font-bold text-xl text-secondary tabular-nums mt-0.5">
                  {data.progress.total}
                </p>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Com mídia
                </span>
                <p className="font-bold text-xl text-primary tabular-nums mt-0.5">
                  {mediaItems.length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Analisados
                </span>
                <p className="font-bold text-xl text-secondary tabular-nums mt-0.5">
                  {data.progress.analisados}
                </p>
              </div>
              <div className="rounded-xl bg-green-50 border border-status-good/15 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Revisados
                </span>
                <p className="font-bold text-xl text-status-good tabular-nums mt-0.5">
                  {data.progress.revisados}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-status-warn/15 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Pendentes
                </span>
                <p className="font-bold text-xl text-status-warn tabular-nums mt-0.5">
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
                        <p className="text-xs text-slate-400">
                          Sem itens neste ambiente.
                        </p>
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
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold">
                {hasExistingReport
                  ? "Regenerar PDF"
                  : "Finalizar e gerar PDF"}
              </h3>
              <p className="text-xs text-slate-500">
                Gera o relatório fotográfico (PDF) e o link público com token.
                Requer worker ativo (`npm run worker`).
              </p>

              {hasExistingReport && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Motivo da regeneração
                  </label>
                  <input
                    type="text"
                    value={regenMotivo}
                    onChange={(e) => setRegenMotivo(e.target.value)}
                    placeholder="Ex.: correção de descrição"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={!canFinalize || finalizing}
                onClick={handleFinalize}
                className="w-full rounded-full bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-3 text-sm font-bold transition-colors min-h-[48px]"
              >
                {finalizing
                  ? "Enfileirando…"
                  : hasExistingReport
                    ? "Regenerar PDF"
                    : "Finalizar e gerar PDF"}
              </button>

              {finalizeError && (
                <p className="text-sm text-status-bad">{finalizeError}</p>
              )}

              {publicUrl && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Link público
                  </p>
                  <p className="text-xs break-all font-mono text-slate-700">
                    {publicUrl}
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-sm font-semibold text-primary hover:underline min-h-[44px]"
                    >
                      {copied ? "Copiado!" : "Copiar link"}
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-slate-600 hover:underline min-h-[44px] inline-flex items-center"
                    >
                      Abrir
                    </a>
                  </div>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-full bg-[#25D366] hover:bg-[#20ba56] text-white text-xs font-bold"
                    >
                      Enviar por WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={markingSent}
                    onClick={handleMarkSent}
                    className="w-full min-h-[40px] rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {markingSent ? "Salvando…" : "Marcar como enviado"}
                  </button>
                  {sentMsg && (
                    <p className="text-[11px] text-slate-500">{sentMsg}</p>
                  )}
                </div>
              )}

              {data.relatorio && (
                <p className="text-[11px] text-slate-400">
                  Versão atual: {data.relatorio.versaoAtual}
                  {data.relatorio.geradoEm
                    ? ` · ${formatWhen(data.relatorio.geradoEm)}`
                    : ""}
                </p>
              )}
            </div>

            {/* D-19: regeneration history */}
            {data.relatorio?.historicoGeracoes &&
              data.relatorio.historicoGeracoes.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold mb-3">
                    Histórico de gerações
                  </h3>
                  <ul className="space-y-3 text-xs">
                    {[...data.relatorio.historicoGeracoes]
                      .reverse()
                      .map((h, idx) => (
                        <li
                          key={`${h.versionNumber}-${h.createdAt}-${idx}`}
                          className="border-b border-slate-50 pb-2"
                        >
                          <p className="font-bold">
                            v{h.versionNumber ?? "?"}
                            {h.userNome ? ` · ${h.userNome}` : ""}
                          </p>
                          <p className="text-slate-500">
                            {formatWhen(h.createdAt)}
                          </p>
                          {h.motivo && (
                            <p className="text-slate-600 mt-0.5">{h.motivo}</p>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Informações do Imóvel</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong className="font-semibold text-slate-500">
                    Endereço:
                  </strong>{" "}
                  {formatEndereco(data.imovel)}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">
                    Código:
                  </strong>{" "}
                  {data.vistoria.codigo}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">Tipo:</strong>{" "}
                  {data.vistoria.tipo}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">
                    Status:
                  </strong>{" "}
                  {data.vistoria.status}
                </p>
                <p>
                  <strong className="font-semibold text-slate-500">
                    Vistoriador:
                  </strong>{" "}
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
