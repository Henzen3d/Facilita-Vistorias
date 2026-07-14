import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FieldVistoriaAmbientes({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <Link href={`/field/vistorias/${id}`} className="text-xs text-slate-500 hover:underline">
          ← Voltar
        </Link>
        <span className="font-bold text-sm">Vistoria #{id} — Ambientes</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Protocolo de Chegada Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#00AEEF] flex items-center gap-1">
            🛡️ Protocolo de Chegada
          </h3>
          <p className="text-xs text-slate-500">Realize estas verificações iniciais obrigatórias de segurança e ativação antecipada:</p>
          
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 text-xs">
              <input type="checkbox" className="mt-0.5 rounded border-slate-300" defaultChecked />
              <span>Sem cheiro de Gás (Segurança Obrigatória)</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs">
              <input type="checkbox" className="mt-0.5 rounded border-slate-300" defaultChecked />
              <span>Ligar todas as luzes</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs">
              <input type="checkbox" className="mt-0.5 rounded border-slate-300" defaultChecked />
              <span>Abrir todas as janelas</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs">
              <input type="checkbox" className="mt-0.5 rounded border-slate-300" defaultChecked />
              <span>Ligar aparelhos de ar-condicionado</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs">
              <input type="checkbox" className="mt-0.5 rounded border-slate-300" />
              <span>Ligar torneiras/chuveiro de água quente (Gás)</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs">
              <input type="checkbox" className="mt-0.5 rounded border-slate-300" />
              <span>Dar descargas em todos os vasos sanitários</span>
            </label>
          </div>
        </div>

        {/* Lista de Ambientes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Lista de Ambientes</h3>
          
          <div className="space-y-2">
            <Link 
              href={`/field/vistorias/${id}/ambientes/cozinha`}
              className="block bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold text-sm">Cozinha</p>
                <p className="text-[10px] text-slate-400">3 itens cadastrados</p>
              </div>
              <span className="text-xs text-emerald-600 font-bold">100%</span>
            </Link>

            <Link 
              href={`/field/vistorias/${id}/ambientes/quarto-principal`}
              className="block bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold text-sm">Quarto Principal</p>
                <p className="text-[10px] text-slate-400">4 itens cadastrados</p>
              </div>
              <span className="text-xs text-amber-600 font-bold">50%</span>
            </Link>
          </div>
        </div>

        {/* Finalizar Vistoria Trigger */}
        <Link
          href={`/field/vistorias/${id}/resumo`}
          className="block text-center w-full rounded-full bg-slate-800 py-3 text-white text-xs font-semibold hover:bg-slate-900 transition-colors shadow-md"
        >
          Revisar & Finalizar Vistoria
        </Link>
      </main>
    </div>
  );
}
