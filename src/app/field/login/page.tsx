"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { Button } from "@/components/ui/button";

export default function FieldLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-[100dvh] bg-background-light font-sans text-secondary flex flex-col items-center justify-center p-5">
      {/* Soft brand wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8 space-y-3">
          <div className="mx-auto h-16 w-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-soft">
            <Icon name="check_circle" filled className="text-[36px]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-secondary">
              Facilita Vistorias
            </h1>
            <p className="text-sm text-secondary/70">
              App de campo · sessão de 7 dias
            </p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-secondary tracking-tight">Entrar</h2>
            <p className="text-sm text-slate-600">
              Use seu e-mail corporativo para continuar offline no celular.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="field-email"
                className="block text-xs font-bold uppercase tracking-wide text-slate-600"
              >
                E-mail
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="mail" className="text-[20px]" />
                </span>
                <input
                  id="field-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 min-h-[48px] rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-base text-secondary placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-colors duration-200"
                  placeholder="voce@facilitavistorias.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="field-password"
                className="block text-xs font-bold uppercase tracking-wide text-slate-600"
              >
                Senha
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="lock" className="text-[20px]" />
                </span>
                <input
                  id="field-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 min-h-[48px] rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-base text-secondary placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-colors duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-secondary transition-colors duration-200"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-2xl bg-red-50 border border-red-100 px-3 py-3 text-sm text-red-700"
                role="alert"
              >
                <Icon name="error" className="text-[18px] shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} fullWidth size="lg" className="mt-1">
              {loading ? (
                <>
                  <Icon name="progress_activity" className="text-[22px] animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Icon name="login" className="text-[22px]" />
                  Entrar no app
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 max-w-prose mx-auto">
          Após o login, as vistorias do dia ficam disponíveis offline no aparelho.
        </p>
      </div>
    </div>
  );
}
