"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/app/Icon";

type ContestRow = {
  id: string;
  status: string;
  motivo: string;
  nomeCliente: string | null;
  resposta: string | null;
  createdAt: string;
  resolvidoEm: string | null;
  item: { id: string; nome: string; ambiente: string };
  vistoria: {
    id: string;
    codigo: string;
    imovel: { endereco: string; numero: string | null; bairro: string };
  };
};

export default function AdminContestacoes() {
  const [list, setList] = useState<ContestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contestacoes");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Erro ${res.status}`);
      setList(body.contestacoes || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (
    id: string,
    status: "ACEITA" | "REJEITADA" | "RESOLVIDA" | "EM_ANALISE",
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/contestacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resposta: drafts[id]?.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Erro ${res.status}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao responder");
    } finally {
      setBusyId(null);
    }
  };

  const statusTone = (s: string) => {
    if (s === "PENDENTE" || s === "EM_ANALISE")
      return "bg-red-100 text-red-800";
    if (s === "ACEITA" || s === "RESOLVIDA")
      return "bg-emerald-100 text-emerald-800";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="min-h-screen bg-background-light font-sans text-secondary p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Contestações recebidas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Respostas aos pedidos dos clientes nos relatórios públicos
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50 min-h-[44px] inline-flex items-center gap-1"
          >
            <Icon name="refresh" className="text-[18px]" />
            Atualizar
          </button>
          <Link
            href="/admin"
            className="text-primary text-sm hover:underline font-medium min-h-[44px] flex items-center"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <Icon name="progress_activity" className="animate-spin" />
          Carregando…
        </p>
      )}
      {error && (
        <p className="text-sm text-status-bad bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          {error}
        </p>
      )}

      {!loading && list.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-500 text-sm">
          Nenhuma contestação registrada ainda.
        </div>
      )}

      <div className="space-y-4">
        {list.map((c) => {
          const open = c.status === "PENDENTE" || c.status === "EM_ANALISE";
          const imovel = `${c.vistoria.imovel.endereco}${
            c.vistoria.imovel.numero ? `, ${c.vistoria.imovel.numero}` : ""
          } — ${c.vistoria.imovel.bairro}`;
          return (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase rounded px-2 py-0.5 ${statusTone(
                      c.status,
                    )}`}
                  >
                    {c.status}
                  </span>
                  <h4 className="font-bold text-sm mt-1">
                    {c.item.nome}{" "}
                    <span className="text-slate-400 font-medium">
                      ({c.item.ambiente})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    {c.vistoria.codigo} · {imovel}
                  </p>
                  {c.nomeCliente && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cliente: {c.nomeCliente}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-700">
                <strong>Comentário:</strong> {c.motivo}
              </div>
              {c.resposta && (
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-xs">
                  <strong>Resposta:</strong> {c.resposta}
                </div>
              )}
              {open && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Resposta da equipe
                  </label>
                  <textarea
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs h-16"
                    placeholder="Escreva a resposta e solução…"
                    value={drafts[c.id] || ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => respond(c.id, "ACEITA")}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-white font-semibold text-xs hover:bg-emerald-700 disabled:opacity-50 min-h-[40px]"
                    >
                      Aceitar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => respond(c.id, "REJEITADA")}
                      className="rounded-full bg-red-600 px-4 py-2 text-white font-semibold text-xs hover:bg-red-700 disabled:opacity-50 min-h-[40px]"
                    >
                      Recusar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => respond(c.id, "EM_ANALISE")}
                      className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-50 disabled:opacity-50 min-h-[40px]"
                    >
                      Em análise
                    </button>
                    <Link
                      href={`/admin/vistorias/${c.vistoria.id}`}
                      className="rounded-full border border-primary/30 text-primary px-4 py-2 font-semibold text-xs hover:bg-primary/5 min-h-[40px] inline-flex items-center"
                    >
                      Abrir vistoria
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
