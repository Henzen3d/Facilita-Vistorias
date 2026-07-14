import Link from "next/link";

export default function FieldSync() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <Link href="/field" className="text-xs text-slate-500 hover:underline">
          ← Dashboard
        </Link>
        <span className="font-bold text-sm">Fila de Sincronização</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Status indicator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-center">
          <div className="text-4xl">🔄</div>
          <h2 className="text-lg font-bold">2 Itens Pendentes</h2>
          <p className="text-xs text-slate-400">O app sincroniza automaticamente assim que houver conexão estável com a internet</p>
          <button className="rounded-full bg-[#00AEEF] hover:bg-[#009ACD] text-white px-5 py-2 text-xs font-semibold">
            Tentar Forçar Sync
          </button>
        </div>

        {/* Fila detalhada */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fila de Mídia & Dados</h3>
          
          <div className="space-y-2">
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-sm">Torneira da Pia — Cozinha</p>
                <p className="text-slate-400 text-[10px]">Áudio narração .mp3 (1.2 MB)</p>
              </div>
              <span className="text-amber-600 font-bold uppercase text-[10px] bg-amber-50 px-2 py-0.5 rounded">
                Pendente
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-sm">Porta de Entrada — Quarto Principal</p>
                <p className="text-slate-400 text-[10px]">Foto entrada .jpg (850 KB)</p>
              </div>
              <span className="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                Enviado
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
