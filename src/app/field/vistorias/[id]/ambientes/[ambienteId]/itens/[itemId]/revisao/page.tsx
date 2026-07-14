import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string; itemId: string }>;
}

export default async function FieldItemReview({ params }: PageProps) {
  const resolvedParams = await params;
  const { id, ambienteId, itemId } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <Link href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${itemId}`} className="text-xs text-slate-500 hover:underline">
          ← Voltar à Captura
        </Link>
        <span className="font-bold text-sm">Revisão do Item</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Preview Mídia Enviada */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center">
          <span className="text-xs text-slate-500 font-medium">📸 1 Foto e 🎤 1 Áudio Enviados</span>
        </div>

        {/* Descrição Gerada pela IA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#00AEEF]">Sugestão do Gemini Flash</h3>
          
          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Descrição Sugerida</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-3 text-xs h-32 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00AEEF]"
              defaultValue="Torneira metálica cromada de bica alta instalada na bancada da pia da cozinha. Apresenta funcionamento normal, sem vazamentos constatados. Acabamento brilhante sem riscos profundos."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Estado do Item</label>
            <div className="flex gap-2">
              <button type="button" className="flex-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded py-2 border border-green-200">
                Bom
              </button>
              <button type="button" className="flex-1 bg-slate-50 text-slate-500 text-xs font-bold uppercase rounded py-2">
                Regular
              </button>
              <button type="button" className="flex-1 bg-slate-50 text-slate-500 text-xs font-bold uppercase rounded py-2">
                Ruim
              </button>
            </div>
          </div>
        </div>

        {/* Salvar item */}
        <Link
          href={`/field/vistorias/${id}/ambientes/${ambienteId}`}
          className="block text-center w-full rounded-full bg-[#00AEEF] py-3 text-white text-sm font-semibold hover:bg-[#009ACD]"
        >
          Confirmar e Salvar Item
        </Link>
      </main>
    </div>
  );
}
