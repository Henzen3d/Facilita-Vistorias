"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/relatorio/${token}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Erro ${res.status}`);
      }
      router.push(`/public/r/${token}?confirmado=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao confirmar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Ex: Maria Santos"
        />
      </div>
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
          disabled={loading}
          className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 py-2.5 text-white font-semibold text-xs transition-colors shadow-md disabled:opacity-50 min-h-[44px]"
        >
          {loading ? "Salvando…" : "Confirmar recebimento"}
        </button>
      </div>
    </form>
  );
}
