import Link from "next/link";

export default function AdminAssinaturas() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">✍️ Acompanhamento de Assinatura & Verificação</h1>
          <p className="text-sm text-slate-500">Rastrear status de visualização e confirmação dos relatórios pelos clientes</p>
        </div>
        <Link href="/admin" className="text-[#00AEEF] text-sm hover:underline font-medium">
          Voltar ao Dashboard
        </Link>
      </header>

      {/* Tabela de Rastreamento */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
              <th className="p-4">Cód / Imóvel</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Progresso do Fluxo</th>
              <th className="p-4">Última Ação</th>
              <th className="p-4">Acesso (Visualizações)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <tr>
              <td className="p-4">
                <span className="font-semibold block">#VIS-2026-001</span>
                <span className="text-xs text-slate-400">Rua XV de Novembro, 1234 - Ap 302</span>
              </td>
              <td className="p-4">João da Silva (Locatário)</td>
              <td className="p-4">
                <div className="flex gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Gerado</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Enviado</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Visualizado</span>
                  <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">Confirmado</span>
                </div>
              </td>
              <td className="p-4">
                <span className="block text-xs font-medium">Confirmado em 14/07/2026</span>
                <span className="text-[10px] text-slate-400">Confirmado por: João da Silva</span>
              </td>
              <td className="p-4">
                <span className="font-semibold">3 acessos</span>
              </td>
            </tr>
            <tr>
              <td className="p-4">
                <span className="font-semibold block">#VIS-2026-002</span>
                <span className="text-xs text-slate-400">Alameda Rio Branco, 45 - Casa 02</span>
              </td>
              <td className="p-4">Vera Regina (Locadora)</td>
              <td className="p-4">
                <div className="flex gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Gerado</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Enviado</span>
                  <span className="bg-blue-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">Visualizado</span>
                  <span className="bg-slate-100 text-slate-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Confirmado</span>
                </div>
              </td>
              <td className="p-4">
                <span className="block text-xs font-medium">Visualizado há 2 horas</span>
                <span className="text-[10px] text-red-500">Pendente de Confirmação</span>
              </td>
              <td className="p-4">
                <span className="font-semibold">1 acesso</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
