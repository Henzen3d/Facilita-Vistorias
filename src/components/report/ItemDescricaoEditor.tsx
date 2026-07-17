"use client";

import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function statusTone(
  status: string,
): "pending" | "fair" | "primary" | "good" | "neutral" {
  switch (status) {
    case "REVISADO":
    case "FINALIZADO":
      return "good";
    case "ANALISADO":
    case "EM_ANALISE":
      return "primary";
    case "CAPTURADO":
      return "fair";
    case "PENDENTE":
      return "pending";
    default:
      return "neutral";
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDENTE: "Pendente",
    CAPTURADO: "Capturado",
    EM_ANALISE: "Em análise",
    ANALISADO: "Analisado",
    REVISADO: "Revisado",
    FINALIZADO: "Finalizado",
  };
  return map[status] ?? status;
}

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

  const reviewed = status === "REVISADO" || status === "FINALIZADO";

  return (
    <article
      className={cn(
        "p-4 border rounded-2xl space-y-3 bg-white shadow-sm",
        reviewed ? "border-status-good/25" : "border-slate-100",
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-secondary truncate">{nome}</h4>
          {provedor && (
            <p className="text-xs text-slate-400 mt-0.5">Provedor IA: {provedor}</p>
          )}
        </div>
        <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
      </div>

      {fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl}
          alt={`Foto — ${nome}`}
          className="w-full max-h-52 object-cover rounded-xl border border-slate-100"
        />
      )}

      {transcricao && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1 flex items-center gap-1">
            <Icon name="graphic_eq" className="text-[14px] text-primary" />
            Transcrição do áudio
          </p>
          <p className="text-sm text-slate-600 leading-relaxed max-w-prose">
            {transcricao}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor={`desc-${itemId}`}
          className="text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          Descrição técnica
        </label>
        <textarea
          id={`desc-${itemId}`}
          className="w-full rounded-xl border border-slate-200 p-3 text-sm min-h-[96px] text-secondary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary bg-slate-50 leading-relaxed"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição técnica do item para o relatório fotográfico…"
        />
        <p className="text-[11px] text-slate-400">
          Não use &ldquo;laudo&rdquo; ou &ldquo;laudo técnico&rdquo;.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`estado-${itemId}`}
          className="text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          Estado de conservação
        </label>
        <select
          id={`estado-${itemId}`}
          className="w-full h-11 min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm bg-white text-secondary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
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
          role="status"
          className={cn(
            "text-sm rounded-xl px-3 py-2 border",
            message.type === "ok"
              ? "bg-green-50 text-green-800 border-green-100"
              : "bg-red-50 text-red-700 border-red-100",
          )}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          disabled={saving || !descricao.trim()}
          onClick={() => submit(false)}
        >
          {saving ? (
            <Icon name="progress_activity" className="text-[16px] animate-spin" />
          ) : (
            <Icon name="save" className="text-[16px]" />
          )}
          Salvar revisão
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={saving || !descricao.trim()}
          onClick={() => submit(true)}
        >
          <Icon name="check_circle" className="text-[16px]" />
          Aprovar
        </Button>
      </div>
    </article>
  );
}
