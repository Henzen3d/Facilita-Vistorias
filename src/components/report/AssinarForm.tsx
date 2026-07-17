"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCpf, isValidCpf, stripCpf } from "@/lib/report/cpf";
import { SignaturePad } from "./SignaturePad";

type AssinarFormProps = {
  token: string;
  nomePreenchido?: string | null;
};

export function AssinarForm({ token, nomePreenchido }: AssinarFormProps) {
  const [nome, setNome] = useState(nomePreenchido?.trim() || "");
  const [cpf, setCpf] = useState("");
  const [aceite, setAceite] = useState(false);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    hash: string;
    assinadoEm: string;
  } | null>(null);

  const cpfOk = useMemo(() => isValidCpf(cpf), [cpf]);
  const canSubmit =
    nome.trim().length >= 2 && cpfOk && aceite && Boolean(assinatura) && !loading;

  const handleCpfChange = (value: string) => {
    setCpf(formatCpf(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !assinatura) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/relatorio/${token}/assinar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCompleto: nome.trim(),
          cpf: stripCpf(cpf),
          assinaturaBase64: assinatura,
          aceite: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Erro ${res.status}`);
      }
      setSuccess({
        hash: body.assinaturaHash as string,
        assinadoEm: (body.assinadoEm as string) || new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao assinar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const hashShort =
      success.hash.length > 16
        ? `${success.hash.slice(0, 12)}…${success.hash.slice(-8)}`
        : success.hash;
    return (
      <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="text-lg font-bold text-emerald-900">
          Documento assinado com sucesso
        </h2>
        <p className="text-sm text-emerald-800">
          Assinado em{" "}
          {new Date(success.assinadoEm).toLocaleString("pt-BR", {
            dateStyle: "long",
            timeStyle: "medium",
          })}
        </p>
        <p className="text-xs text-emerald-900/80 break-all">
          Hash de integridade (SHA-256): <strong>{hashShort}</strong>
        </p>
        <p className="text-xs text-slate-600">
          O PDF está sendo atualizado com a página de auditoria. Isso pode
          levar alguns segundos.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={`/public/r/${token}/audit`}
            className="inline-flex items-center justify-center min-h-[48px] rounded-full bg-secondary text-white text-sm font-bold"
          >
            Ver registro de auditoria
          </Link>
          <Link
            href={`/public/r/${token}`}
            className="inline-flex items-center justify-center min-h-[48px] rounded-full border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Voltar ao relatório
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">
          Nome completo
        </label>
        <input
          type="text"
          required
          minLength={2}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm min-h-[44px]"
          placeholder="Como no documento de identidade"
          autoComplete="name"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">
          CPF
        </label>
        <input
          type="text"
          inputMode="numeric"
          required
          value={cpf}
          onChange={(e) => handleCpfChange(e.target.value)}
          className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm min-h-[44px]"
          placeholder="000.000.000-00"
          autoComplete="off"
        />
        {cpf.length >= 14 && !cpfOk && (
          <p className="mt-1 text-xs text-status-bad">CPF inválido</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-slate-500">
          Assinatura
        </p>
        <SignaturePad onChange={setAssinatura} />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          className="mt-1 rounded border-slate-300"
        />
        <span>
          Declaro que li e concordo com o conteúdo deste relatório fotográfico
          / documentação técnica.
        </span>
      </label>

      {error && (
        <p className="text-xs text-status-bad bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Link
          href={`/public/r/${token}`}
          className="flex-1 text-center rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 min-h-[44px] flex items-center justify-center"
        >
          Voltar
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-full bg-secondary hover:opacity-90 py-2.5 text-white font-semibold text-xs transition-colors shadow-md disabled:opacity-50 min-h-[44px]"
        >
          {loading ? "Assinando…" : "Assinar documento"}
        </button>
      </div>
    </form>
  );
}
