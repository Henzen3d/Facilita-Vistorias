import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FieldVistoriaSummary({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <Link href={`/field/vistorias/${id}/ambientes`} className="text-xs text-slate-500 hover:underline">
          ← Voltar
        </Link>
        <span className="font-bold text-sm">Resumo da Vistoria</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Progresso Geral */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wide">Status de Execução</h3>
          <div className="flex justify-between items-center text-sm">
            <span>Total de Ambientes:</span>
            <span className="font-bold">2/2 finalizados</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Total de Itens:</span>
            <span className="font-bold">7 itens analisados</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Mídias Sincronizadas:</span>
            <span className="text-green-600 font-bold">✓ 100% Sincronizado</span>
          </div>
        </div>

        {/* Finalização */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-center">
          <h3 className="font-bold text-base">Tudo pronto para finalizar?</h3>
          <p className="text-xs text-slate-400">Ao finalizar, a vistoria entra em status de revisão no Painel Administrativo para Vera Lúcia aprovar.</p>
          
          <Link
            href={`/field/vistorias/${id}/sucesso`}
            className="block text-center w-full rounded-full bg-[#00AEEF] py-3 text-white text-sm font-semibold hover:bg-[#009ACD]"
          >
            Finalizar Vistoria
          </Link>
        </div>
      </main>
    </div>
  );
}
