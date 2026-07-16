"use client"

import { getSession, signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou senha incorretos")
        return
      }

      const session = await getSession()
      const role = session?.user?.role

      if (role === "VISTORIADOR") {
        router.push("/field")
      } else {
        router.push("/admin")
      }
      router.refresh()
    } catch {
      setError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen lg:h-screen lg:grid lg:grid-cols-2 bg-slate-50 overflow-hidden">
      {/* 
        ESQUERDA (DESKTOP)
        - Coluna visual idêntica à página de boas-vindas para criar uma transição perfeita.
        - Oculta no mobile para manter o formulário de login limpo e focado.
      */}
      <div
        className="hidden lg:block lg:relative lg:col-span-1 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/tela-final.jpg')" }}
      >
        {/* Overlay escuro para contraste */}
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]" />
        
        {/* Conteúdo do lado esquerdo (Desktop) */}
        <div className="flex flex-col justify-between h-full p-12 relative z-10 text-white">
          {/* Logo compacta */}
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/10">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Facilita <span className="text-primary font-semibold">Vistorias</span>
            </span>
          </Link>

          {/* Headline Centralizada */}
          <div className="max-w-md my-auto space-y-6">
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
              Bem-vindo ao <br />
              <span className="font-serif-accent italic font-normal text-primary text-6xl capitalize">
                Facilita Vistorias
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-[32ch]">
              A plataforma inteligente para vistorias residenciais rápidas, seguras e detalhadas.
            </p>
          </div>

          {/* Rodapé */}
          <div className="text-sm text-white/50 font-medium">
            v1.0.0 • Facilita Vistorias © 2026
          </div>
        </div>
      </div>

      {/* 
        DIREITA (DESKTOP) / TELA CHEIA (MOBILE)
        - Lado do formulário de login.
      */}
      <div className="flex flex-col justify-center items-center min-h-screen lg:min-h-0 lg:col-span-1 p-6 sm:p-12 lg:p-16 bg-slate-50 w-full">
        {/* Card do Formulário */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-soft border border-slate-100/80 flex flex-col">
          
          {/* Logo (Visível no Mobile no topo do card) */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4 shadow-soft shadow-primary/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-secondary">
              Acessar o Sistema
            </h2>
            <p className="text-sm text-secondary/60 mt-1 text-center">
              Insira suas credenciais para continuar
            </p>
          </div>

          {/* Formulário de Login */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-secondary mb-1">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-secondary placeholder-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="exemplo@facilitavistorias.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-secondary mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-secondary placeholder-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-status-bad text-xs font-semibold text-center" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center h-12 bg-primary text-white font-bold rounded-full transition-all duration-200 hover:bg-primary-hover hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Dicas de Acesso / Credenciais de Teste */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">
              Credenciais de Teste:
            </h4>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-secondary/70 space-y-1.5 font-medium">
              <div>
                <span className="font-bold text-secondary">Administrador:</span>
                <div className="font-mono text-secondary/60 select-all mt-0.5">admin@facilitavistorias.com.br / senha123</div>
              </div>
              <div className="pt-1.5 border-t border-slate-200/40">
                <span className="font-bold text-secondary">Vistoriador:</span>
                <div className="font-mono text-secondary/60 select-all mt-0.5">vistoriador@facilitavistorias.com.br / senha123</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Mobile */}
        <div className="mt-8 text-xs text-secondary/40 font-medium lg:hidden">
          v1.0.0 • Facilita Vistorias © 2026
        </div>
      </div>
    </main>
  )
}
