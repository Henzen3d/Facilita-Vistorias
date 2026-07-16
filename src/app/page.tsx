import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen lg:h-screen lg:grid lg:grid-cols-2 bg-secondary overflow-hidden">
      {/* 
        ESQUERDA (DESKTOP) / FUNDO COMPLETO (MOBILE)
        - No mobile, cobre toda a tela como absoluto.
        - No desktop, fica confinado à primeira coluna do grid (lado esquerdo).
      */}
      <div
        className="absolute inset-0 lg:relative lg:col-span-1 bg-cover bg-[position:50%_90%] lg:bg-center bg-no-repeat transition-transform duration-1000 ease-out"
        style={{ backgroundImage: "url('/tela-final.jpg')" }}
      >
        {/* Overlay escuro de contraste - Apenas no Desktop */}
        <div className="hidden lg:block absolute inset-0 lg:bg-slate-950/50" />
        
        {/* Conteúdo exclusivo da coluna esquerda no desktop (oculto no mobile) */}
        <div className="hidden lg:flex flex-col justify-between h-full p-12 relative z-10 text-white">
          {/* Logo compacta superior */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/10">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Facilita <span className="text-primary font-semibold">Vistorias</span>
            </span>
          </div>

          {/* Headline Centralizada na Esquerda */}
          <div className="max-w-md my-auto space-y-6">
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
              Bem-vindo ao <br />
              <span className="font-serif-accent italic font-normal text-primary text-6xl capitalize">
                Facilita Vistorias
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-[32ch]">
              A plataforma inteligente para vistorias residenciais rápidas.
            </p>
          </div>

          {/* Rodapé compacto */}
          <div className="text-sm text-white/50 font-medium">
            v1.0.0 • Facilita Vistorias © 2026
          </div>
        </div>
      </div>

      {/* 
        DIREITA (DESKTOP) / CONTEÚDO DIRETO (MOBILE)
        - No mobile: Conteúdo renderizado de forma transparente diretamente sobre a imagem de fundo.
        - No desktop: Coluna da direita cinza-clara com o card de ações branco centralizado.
      */}
      <div className="relative w-full max-w-md lg:max-w-none bg-transparent lg:bg-slate-50 p-8 md:p-10 lg:p-16 flex flex-col justify-center items-center text-center mx-auto z-10 md:mb-0 lg:col-span-1 transition-all duration-300">
        
        {/* Card interno: transparente no mobile, branco com sombra no desktop */}
        <div className="w-full max-w-sm bg-transparent lg:bg-white lg:p-10 lg:rounded-[2rem] lg:shadow-soft lg:border lg:border-slate-100 flex flex-col items-center">
          
          {/* Logo circular: oculto no mobile, visível no desktop */}
          <div className="hidden lg:flex w-16 h-16 rounded-full bg-primary items-center justify-center mb-6 shadow-soft shadow-primary/30">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          {/* Título visível no mobile (texto escuro para contraste no fundo claro), oculto no desktop */}
          <h1 className="text-3xl font-extrabold text-secondary tracking-tight mb-3 lg:hidden">
            Bem-vindo ao{" "}
            <span className="block mt-1 font-serif-accent italic font-normal text-primary text-4xl capitalize">
              Facilita Vistorias
            </span>
          </h1>

          {/* Headline interna de Card para Desktop */}
          <h2 className="hidden lg:block text-2xl font-bold text-secondary mb-2">
            Acessar Plataforma
          </h2>

          {/* Texto descritivo reduzido (em escuro para mobile sobre o fundo branco) */}
          <p className="text-base text-secondary/75 max-w-[28ch] mb-8 leading-relaxed">
            A plataforma inteligente para vistorias residenciais rápidas.
          </p>

          {/* Botões de Ação */}
          <div className="w-full space-y-4">
            <Link
              href="/login?show=form"
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-white font-bold tracking-wide transition-all duration-200 hover:bg-primary-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Entrar no Sistema
            </Link>

            <a
              href="https://wa.me/5547999999999?text=Olá!%20Gostaria%20de%20solicitar%20o%20meu%20cadastro%20no%20Facilita%20Vistorias."
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center rounded-full border border-secondary/20 bg-transparent text-secondary font-semibold transition-all duration-200 hover:bg-secondary/5 hover:border-secondary/40 focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              Fazer Cadastro
            </a>
          </div>

          {/* Rodapé interno (apenas mobile, com margem e cor ajustadas para espaço) */}
          <div className="mt-4 text-xs text-secondary/40 font-medium lg:hidden">
            v1.0.0 • Facilita Vistorias © 2026
          </div>
        </div>
      </div>
    </main>
  );
}
