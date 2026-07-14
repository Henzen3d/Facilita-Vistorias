import Link from "next/link";

export default function AdminCadastros() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">⚙️ Cadastros do Sistema</h1>
          <p className="text-sm text-slate-500">Gerenciar imóveis, proprietários, locatários e vistoriadores</p>
        </div>
        <Link href="/admin" className="text-[#00AEEF] text-sm hover:underline font-medium">
          Voltar ao Dashboard
        </Link>
      </header>

      {/* Grid de Abas/Opções */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold">🏠 Imóveis</h3>
          <p className="text-xs text-slate-400">Total cadastrados: 124</p>
          <button className="w-full text-xs font-semibold text-white bg-[#00AEEF] py-2 rounded-full hover:bg-[#009ACD]">
            Cadastrar Novo Imóvel
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold">👥 Pessoas</h3>
          <p className="text-xs text-slate-400">Total (Locatários/Locadores): 245</p>
          <button className="w-full text-xs font-semibold text-white bg-[#00AEEF] py-2 rounded-full hover:bg-[#009ACD]">
            Cadastrar Nova Pessoa
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold">👮 Vistoriadores</h3>
          <p className="text-xs text-slate-400">Ativos: 3</p>
          <button className="w-full text-xs font-semibold text-white bg-[#00AEEF] py-2 rounded-full hover:bg-[#009ACD]">
            Cadastrar Novo Vistoriador
          </button>
        </div>
      </div>
    </div>
  );
}
