import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilita Vistorias</h1>
          <p className="text-sm text-slate-500">Painel Administrativo — Dashboard de Métricas</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/agenda"
            className="rounded-full bg-[#00AEEF] px-5 py-2 text-white font-medium hover:bg-[#009ACD] transition-colors shadow-[0_4px_6px_-1px_rgba(0,174,239,0.1)]"
          >
            Nova Vistoria
          </Link>
        </div>
      </header>

      {/* Grid de KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vistorias Concluídas (Mês)</span>
          <h2 className="text-3xl font-bold mt-2">42</h2>
          <span className="text-xs text-green-600 font-medium">↑ 12% em relação a Junho</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tempo Médio de Entrega</span>
          <h2 className="text-3xl font-bold mt-2">1.5 dias</h2>
          <span className="text-xs text-slate-500">Média entre campo e envio</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aceito sem Edição IA</span>
          <h2 className="text-3xl font-bold mt-2">84%</h2>
          <span className="text-xs text-slate-500">Métrica de acerto do Gemini</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxa de Contestação</span>
          <h2 className="text-3xl font-bold mt-2">4.7%</h2>
          <span className="text-xs text-red-500 font-medium">2 vistorias contestadas</span>
        </div>
      </section>

      {/* Seção Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Vistorias Recentes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Vistorias Recentes</h3>
            <Link href="/admin/vistorias" className="text-[#00AEEF] text-sm hover:underline font-medium">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">Rua XV de Novembro, 1234 - Ap 302</p>
                <p className="text-xs text-slate-400">Vistoriador: Osmar Gonçalves | Entrada</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide rounded px-2.5 py-1">
                Concluída
              </span>
            </div>
            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">Alameda Rio Branco, 45 - Casa 02</p>
                <p className="text-xs text-slate-400">Vistoriador: Osmar Gonçalves | Saída</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide rounded px-2.5 py-1">
                Em Revisão
              </span>
            </div>
          </div>
        </div>

        {/* Links Rápidos do Painel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-lg font-bold mb-2">Navegação</h3>
          <Link href="/admin/agenda" className="p-3 bg-[#F8FAFC] rounded-xl hover:bg-slate-100 font-medium text-sm flex items-center gap-2">
            📅 Agenda & Calendário
          </Link>
          <Link href="/admin/vistorias" className="p-3 bg-[#F8FAFC] rounded-xl hover:bg-slate-100 font-medium text-sm flex items-center gap-2">
            📋 Gerenciamento de Vistorias
          </Link>
          <Link href="/admin/assinaturas" className="p-3 bg-[#F8FAFC] rounded-xl hover:bg-slate-100 font-medium text-sm flex items-center gap-2">
            ✍️ Acompanhamento de Assinaturas
          </Link>
          <Link href="/admin/contestacoes" className="p-3 bg-[#F8FAFC] rounded-xl hover:bg-slate-100 font-medium text-sm flex items-center gap-2">
            ⚠️ Contestações Pendentes
          </Link>
          <Link href="/admin/cadastros" className="p-3 bg-[#F8FAFC] rounded-xl hover:bg-slate-100 font-medium text-sm flex items-center gap-2">
            ⚙️ Cadastros do Sistema
          </Link>
        </div>
      </div>
    </div>
  );
}
