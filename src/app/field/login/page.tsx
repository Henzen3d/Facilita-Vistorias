import Link from "next/link";

export default function FieldLogin() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Facilita Vistorias</h1>
          <p className="text-xs text-slate-400">PWA de Campo — Sessão de 7 dias</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">E-mail</label>
            <input type="email" required className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" placeholder="Ex: osmar@facilitavistorias.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Senha</label>
            <input type="password" required className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" placeholder="••••••••" />
          </div>
          <Link
            href="/field"
            className="block text-center w-full rounded-full bg-[#00AEEF] py-2 text-white font-medium hover:bg-[#009ACD] transition-colors"
          >
            Entrar
          </Link>
        </form>
      </div>
    </div>
  );
}
