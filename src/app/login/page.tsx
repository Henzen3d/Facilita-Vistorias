"use client"

import { getSession, signIn } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Estado para alternar entre a tela de boas-vindas e o formulário de login no mobile
  const [showForm, setShowForm] = useState(false)

  // Verifica se veio da página inicial pedindo para exibir o formulário direto
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("show") === "form") {
        setShowForm(true)
      }
    }
  }, [])

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
        ========================================================================
        ESQUERDA (DESKTOP) / FUNDO COMPLETO (MOBILE - TELA DE BOAS-VINDAS)
        ========================================================================
        - No desktop: Coluna visual fixa na esquerda.
        - No mobile: Imagem de fundo cobrindo a tela toda, visível apenas quando showForm for falso.
      */}
      {/* Imagem de fundo no Mobile (Fundo Claro Recortado, sem overlay escuro) */}
      <div
        className={`absolute inset-0 lg:hidden bg-cover bg-center bg-no-repeat transition-all duration-500 ease-out ${
          showForm ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        }`}
        style={{ backgroundImage: "url('/tela-mobile-final.jpg')" }}
      />

      {/* Imagem de fundo e painel visual no Desktop (Lado Esquerdo, com overlay escuro) */}
      <div
        className="hidden lg:flex lg:relative lg:col-span-1 bg-cover bg-[position:50%_35%] bg-no-repeat flex-col justify-between h-full p-12 text-white"
        style={{ backgroundImage: "url('/tela-final.jpg')" }}
      >
        {/* Overlay escuro de contraste - Apenas no Desktop */}
        <div className="absolute inset-0 bg-slate-950/50 z-0" />
        
        {/* Conteúdo exclusivo da coluna esquerda no desktop */}
        <div className="flex flex-col justify-between h-full w-full relative z-10">
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

          <div className="max-w-md my-auto space-y-6">
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
              Bem-vindo a <br />
              <span className="font-serif-accent italic font-normal text-primary text-6xl capitalize">
                Facilita Vistorias
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-[32ch]">
              A plataforma inteligente para vistorias residenciais rápidas.
            </p>
          </div>

          <div className="text-sm text-white/50 font-medium">
            v1.0.0 • Facilita Vistorias © 2026
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        MOBILE - TELA DE BOAS-VINDAS (CONTEÚDO DIRETO SOBRE A IMAGEM)
        ========================================================================
        - Visível apenas no mobile (`lg:hidden`) e quando `showForm === false`.
        - Conteúdo direto sobre a imagem, sem a gaveta e sem o ícone.
      */}
      {!showForm && (
        <div className="lg:hidden absolute bottom-0 left-0 right-0 w-full max-w-md bg-transparent p-8 flex flex-col items-center text-center mx-auto z-20 animate-fade-in-up">
          
          {/* Título de Boas-Vindas (em escuro para contraste no fundo claro) */}
          <h1 className="text-3xl font-extrabold text-secondary tracking-tight mb-3">
            Bem-vindo a{" "}
            <span className="block mt-1 font-serif-accent italic font-normal text-primary text-4xl capitalize">
              Facilita Vistorias
            </span>
          </h1>

          {/* Texto descritivo reduzido e em escuro */}
          <p className="text-base text-secondary/75 max-w-[28ch] mb-8 leading-relaxed">
            A plataforma inteligente para vistorias residenciais rápidas.
          </p>

          {/* Botões de Ação */}
          <div className="w-full space-y-4">
            <button
              onClick={() => setShowForm(true)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-white font-bold tracking-wide transition-all duration-200 hover:bg-primary-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Entrar no Sistema
            </button>

            <a
              href="https://wa.me/5547999999999?text=Olá!%20Gostaria%20de%20solicitar%20o%20meu%20cadastro%20no%20Facilita%20Vistorias."
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center rounded-full border border-secondary/20 bg-transparent text-secondary font-semibold transition-all duration-200 hover:bg-secondary/5 hover:border-secondary/40"
            >
              Fazer Cadastro
            </a>
          </div>

          {/* Rodapé interno mobile (margem reduzida mt-4 e texto escuro) */}
          <div className="mt-4 text-xs text-secondary/40 font-medium">
            v1.0.0 • Facilita Vistorias © 2026
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        FORMULÁRIO DE LOGIN
        ========================================================================
        - No desktop: Sempre visível na coluna da direita.
        - No mobile: Visível em tela cheia apenas quando `showForm === true`.
      */}
      <div
        className={`flex flex-col justify-center items-center min-h-screen lg:min-h-0 lg:col-span-1 p-6 sm:p-12 lg:p-16 bg-slate-50 w-full transition-all duration-500 ${
          showForm ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none lg:opacity-100 lg:scale-100 lg:pointer-events-auto"
        }`}
      >
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-soft border border-slate-100/80 flex flex-col">
          
          {/* Botão de voltar no mobile */}
          {showForm && (
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-xs font-semibold text-secondary/60 hover:text-secondary mb-4 self-start lg:hidden transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para boas-vindas
            </button>
          )}

          {/* Logo e cabeçalho */}
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

          {/* Formulário */}
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

          {/* Credenciais de Teste */}
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
