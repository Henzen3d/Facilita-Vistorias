import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string; itemId: string }>;
}

export default async function FieldItemCapture({ params }: PageProps) {
  const resolvedParams = await params;
  const { id, ambienteId, itemId } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <Link href={`/field/vistorias/${id}/ambientes/${ambienteId}`} className="text-xs text-slate-500 hover:underline">
          ← Voltar
        </Link>
        <span className="font-bold text-sm">Capturar Mídia</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full flex flex-col justify-between">
        {/* Preview da Câmera Mock */}
        <div className="bg-slate-900 aspect-video rounded-3xl overflow-hidden flex flex-col items-center justify-center relative shadow-inner">
          <span className="text-xs text-slate-500">[ Preview da Câmera Nativa ]</span>
          <div className="absolute bottom-4 flex gap-4">
            <button className="bg-white text-slate-900 text-xs px-3 py-1.5 rounded-full font-semibold shadow">
              📸 Tirar Foto
            </button>
          </div>
        </div>

        {/* Gravador de Áudio Mock */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-center">
          <h3 className="font-bold text-sm">Narração em Áudio</h3>
          <p className="text-xs text-slate-400">Descreva o item e as avarias que você está vendo no momento</p>
          
          <div className="flex justify-center">
            <button className="h-16 w-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-md transition-colors animate-pulse">
              🎤 Gravar
            </button>
          </div>
        </div>

        {/* FAB Menu Simulator */}
        <div className="flex justify-around items-center bg-white p-3 rounded-full border border-slate-100 shadow-sm">
          <button className="text-xs text-slate-500 hover:text-[#00AEEF] font-semibold">Foto</button>
          <button className="text-xs text-slate-500 hover:text-[#00AEEF] font-semibold">Áudio</button>
          <button className="text-xs text-slate-500 hover:text-[#00AEEF] font-semibold">Nota</button>
          <button className="text-xs text-red-500 font-semibold">Avaria</button>
        </div>

        {/* Avançar para Revisão */}
        <Link
          href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${itemId}/revisao`}
          className="block text-center w-full rounded-full bg-[#00AEEF] py-3 text-white text-sm font-semibold hover:bg-[#009ACD]"
        >
          Enviar Mídia & Ver Análise IA
        </Link>
      </main>
    </div>
  );
}
