"use client";

import { useState } from "react";
import { Icon } from "@/components/app/Icon";

export type ItemDescricaoEditorProps = {
  vistoriaId: string;
  itemId: string;
  nome: string;
  fotoUrl?: string;
  descricaoFinal: string;
  estadoConservacao?: string | null;
  status: string;
  provedor?: string | null;
  transcricao?: string | null;
  onSaved?: (item: {
    id: string;
    status: string;
    descricaoFinal: string | null;
    descricaoEditada: boolean;
    estadoConservacao: string | null;
  }) => void;
};

const ESTADOS = ["NOVO", "BOM", "REGULAR", "RUIM"] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDENTE: "bg-slate-100 text-slate-600",
  CAPTURADO: "bg-amber-100 text-amber-800",
  EM_ANALISE: "bg-sky-100 text-sky-800",
  ANALISADO: "bg-indigo-100 text-indigo-800",
  REVISADO: "bg-emerald-100 text-emerald-800",
  FINALIZADO: "bg-emerald-100 text-emerald-900",
};

export function ItemDescricaoEditor({
  vistoriaId,
  itemId,
  nome,
  fotoUrl,
  descricaoFinal: initialDescricao,
  estadoConservacao: initialEstado,
  status: initialStatus,
  provedor,
  transcricao,
  onSaved,
}: ItemDescricaoEditorProps) {
  const [descricao, setDescricao] = useState(initialDescricao ?? "");
  const [estado, setEstado] = useState(initialEstado ?? "BOM");
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const submit = async (approve: boolean) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/vistorias/${vistoriaId}/itens/${itemId}/descricao`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descricaoFinal: descricao,
            estadoConservacao: estado,
            approve,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.code === "REGULATED_TERM") {
          setMessage({
            type: "err",
            text:
              data.error ||
              'Não use termos regulados. Prefira "relatório fotográfico" ou "documentação técnica".',
          });
        } else {
          setMessage({
            type: "err",
            text: data?.error || "Falha ao salvar revisão",
          });
        }
        return;
      }

      const item = data.item;
      setStatus(item.status);
      if (item.descricaoFinal != null) setDescricao(item.descricaoFinal);
      if (item.estadoConservacao) setEstado(item.estadoConservacao);
      setMessage({
        type: "ok",
        text: approve
          ? "Descrição aprovada e marcada como revisada."
          : "Revisão salva com sucesso.",
      });
      onSaved?.(item);
    } catch {
      setMessage({ type: "err", text: "Erro de rede ao salvar revisão." });
    } finally {
      setSaving(false);
    }
  };

  const badgeClass = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="p-4 border border-slate-100 rounded-xl space-y-3 bg-white">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-sm text-[#1A2B3C] truncate">{nome}</h4>
          {provedor && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Provedor IA: {provedor}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase rounded px-2 py-0.5 ${badgeClass}`}
        >
          {status}
        </span>
      </div>

      {fotoUrl && (
        <img
          src={fotoUrl}
          alt={`Foto — ${nome}`}
          className="w-full max-h-48 object-cover rounded-lg border border-slate-100"
        />
      )}

      {transcricao && (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            Transcrição do áudio
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">{transcricao}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500">
          Descrição técnica
        </label>
        <textarea
          className="w-full rounded-lg border border-slate-200 p-2.5 text-xs h-24 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição técnica do item para o relatório fotográfico…"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500">
          Estado de conservação
        </label>
        <select
          className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p
          className={`text-xs rounded-lg px-3 py-2 ${
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={saving || !descricao.trim()}
          onClick={() => submit(false)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#00AEEF] hover:bg-[#009ACD] text-white text-xs font-bold px-4 py-2 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Icon name="progress_activity" className="text-[16px] animate-spin" />
          ) : (
            <Icon name="save" className="text-[16px]" />
          )}
          Salvar revisão
        </button>
        <button
          type="button"
          disabled={saving || !descricao.trim()}
          onClick={() => submit(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1A2B3C] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 disabled:opacity-50 transition-colors"
        >
          <Icon name="check_circle" className="text-[16px]" />
          Aprovar sem editar
        </button>
      </div>
    </div>
  );
}
