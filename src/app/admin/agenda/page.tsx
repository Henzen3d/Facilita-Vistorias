import Link from "next/link";

export default function AdminAgenda() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📅 Agenda & Calendário</h1>
          <p className="text-sm text-slate-500">Agendar novas vistorias e atribuir aos vistoriadores</p>
        </div>
        <Link href="/admin" className="text-[#00AEEF] text-sm hover:underline font-medium">
          Voltar ao Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Novo Agendamento */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-bold mb-6">Novo Agendamento</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Imóvel (Endereço)</label>
              <input type="text" className="w-full rounded-lg border border-slate-200 p-2 text-sm" placeholder="Ex: Rua XV de Novembro, 123" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Vistoria</label>
              <select className="w-full rounded-lg border border-slate-200 p-2 text-sm">
                <option>Entrada</option>
                <option>Saída</option>
                <option>Contra-Vistoria</option>
                <option>Compra Segura</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vistoriador Responsável</label>
              <select className="w-full rounded-lg border border-slate-200 p-2 text-sm">
                <option>Osmar Gonçalves</option>
                <option>Novo Contratado 1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data e Hora</label>
              <input type="datetime-local" className="w-full rounded-lg border border-slate-200 p-2 text-sm" />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[#00AEEF] py-2 text-white font-medium hover:bg-[#009ACD] transition-colors"
            >
              Agendar Vistoria
            </button>
          </form>
        </div>

        {/* Lista de Compromissos da Semana */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold mb-6">Compromissos Agendados</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">Rua XV de Novembro, 1234 - Ap 302</p>
                <p className="text-xs text-slate-400">Terça-feira, 14 de Julho às 14:00 | Entrada</p>
                <p className="text-xs text-slate-500 mt-1">Responsável: Osmar Gonçalves</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide rounded px-2.5 py-1">
                Agendada
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">Rua Curt Hering, 88 - Ap 101</p>
                <p className="text-xs text-slate-400">Quarta-feira, 15 de Julho às 09:30 | Saída</p>
                <p className="text-xs text-slate-500 mt-1">Responsável: Osmar Gonçalves</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide rounded px-2.5 py-1">
                Agendada
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
