"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FieldLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos");
        return;
      }

      const session = await getSession();
      const role = session?.user?.role;

      // Comparar por string evita puxar @prisma/client no client bundle
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "VISTORIADOR") {
        router.push("/field");
      } else {
        setError("Usuário sem permissão para o app de campo");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Facilita Vistorias</h1>
          <p className="text-xs text-slate-400">PWA de Campo — Sessão de 7 dias</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="field-email"
              className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500"
            >
              E-mail
            </label>
            <input
              id="field-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm"
              placeholder="Ex: osmar@facilitavistorias.com"
            />
          </div>
          <div>
            <label
              htmlFor="field-password"
              className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500"
            >
              Senha
            </label>
            <input
              id="field-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="block text-center w-full rounded-full bg-[#00AEEF] py-2 text-white font-medium hover:bg-[#009ACD] transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
