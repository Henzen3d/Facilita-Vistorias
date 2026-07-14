import Link from "next/link";

export default function FieldDashboard() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      {/* Top Header */}
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Olá, Osmar Gonçalves</h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Vistoriador de Campo</p>
        </div>
        <div className="flex gap-2">
          <Link href="/field/sync" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-xs">
            🔄 Sync
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Vistorias do Dia</h3>
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5">
                  Agendada — 14:00
                </span>
                <h4 className="font-bold text-sm mt-2">Rua XV de Novembro, 1234 - Ap 302</h4>
                <p className="text-xs text-slate-400">Tipo: Vistoria de Entrada</p>
              </div>
              <Link
                href="/field/vistorias/1"
                className="block text-center w-full rounded-full bg-[#00AEEF] py-2 text-white text-xs font-semibold hover:bg-[#009ACD]"
              >
                Ver Detalhes
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
