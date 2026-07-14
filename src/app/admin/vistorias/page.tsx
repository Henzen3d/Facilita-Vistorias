import Link from "next/link";

export default function AdminVistoriasList() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📋 Lista de Vistorias</h1>
          <p className="text-sm text-slate-500">Filtrar, gerenciar e revisar relatórios de vistorias</p>
        </div>
        <Link href="/admin" className="text-[#00AEEF] text-sm hover:underline font-medium">
          Voltar ao Dashboard
        </Link>
      </header>

      {/* Filtros */}
      <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 mb-6">
        <input type="text" placeholder="Buscar endereço ou cliente..." className="rounded-lg border border-slate-200 p-2 text-sm flex-1 min-w-[200px]" />
        <select className="rounded-lg border border-slate-200 p-2 text-sm">
          <option>Todos os Status</option>
          <option>Agendada</option>
          <option>Em Campo</option>
          <option>Em Revisão</option>
          <option>Concluída</option>
          <option>Contestada</option>
        </select>
        <select className="rounded-lg border border-slate-200 p-2 text-sm">
          <option>Todas as Empresas</option>
        </select>
      </section>

      {/* Lista Principal */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
              <th className="p-4">Cód / Imóvel</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Vistoriador</th>
              <th className="p-4">Data</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <tr>
              <td className="p-4">
                <span className="font-semibold block">#VIS-2026-001</span>
                <span className="text-xs text-slate-400">Rua XV de Novembro, 1234 - Ap 302</span>
              </td>
              <td className="p-4">Entrada</td>
              <td className="p-4">Osmar Gonçalves</td>
              <td className="p-4">14/07/2026</td>
              <td className="p-4">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide rounded px-2 py-0.5">
                  Concluída
                </span>
              </td>
              <td className="p-4">
                <Link href="/admin/vistorias/1" className="text-[#00AEEF] hover:underline font-semibold mr-4">
                  Revisar
                </Link>
                <Link href="/public/r/token-mock" className="text-slate-400 hover:underline">
                  Ver Relatório
                </Link>
              </td>
            </tr>
            <tr>
              <td className="p-4">
                <span className="font-semibold block">#VIS-2026-002</span>
                <span className="text-xs text-slate-400">Alameda Rio Branco, 45 - Casa 02</span>
              </td>
              <td className="p-4">Saída</td>
              <td className="p-4">Osmar Gonçalves</td>
              <td className="p-4">15/07/2026</td>
              <td className="p-4">
                <span className="bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide rounded px-2 py-0.5">
                  Em Revisão
                </span>
              </td>
              <td className="p-4">
                <Link href="/admin/vistorias/2" className="text-[#00AEEF] hover:underline font-semibold mr-4">
                  Revisar
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
