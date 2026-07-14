import Link from "next/link";

export default function AdminContestacoes() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">⚠️ Contestações Recebidas</h1>
          <p className="text-sm text-slate-500">Visualizar e responder às contestações enviadas pelos clientes nos relatórios públicos</p>
        </div>
        <Link href="/admin" className="text-[#00AEEF] text-sm hover:underline font-medium">
          Voltar ao Dashboard
        </Link>
      </header>

      {/* Lista de Contestações */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-red-200 text-red-800 text-[10px] font-bold uppercase rounded px-2 py-0.5">Pendente</span>
              <h4 className="font-bold text-sm mt-1">Item: Parede Direita (Quarto Principal)</h4>
              <p className="text-xs text-slate-500">Vistoria #VIS-2026-001 | Imóvel: Rua XV de Novembro, 1234 - Ap 302</p>
            </div>
            <span className="text-xs text-slate-400">Recebido em 14/07/2026</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-red-100 text-xs">
            <strong>Comentário do Cliente:</strong> &quot;Há um furo de bucha de cortina que não está descrito na análise de vocês. Gostaria que fosse adicionado para evitar cobrança posterior.&quot;
          </div>
          <form className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">Resposta da Equipe:</label>
            <textarea className="w-full rounded-lg border border-slate-200 p-2 text-xs h-16" placeholder="Escreva a resposta e solução..." />
            <div className="flex gap-2">
              <button type="submit" className="rounded-full bg-emerald-600 px-4 py-1.5 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors">
                Aceitar Contestação (Atualizar Item)
              </button>
              <button type="button" className="rounded-full bg-red-600 px-4 py-1.5 text-white font-semibold text-xs hover:bg-red-700 transition-colors">
                Recusar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
