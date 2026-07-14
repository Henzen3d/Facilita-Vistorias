import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicReportDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const { token } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1A2B3C] font-sans">
      {/* Header com estilo institucional */}
      <header className="bg-white border-b border-slate-100 py-6 px-8 flex justify-between items-center shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00AEEF]">Documentação Técnica</span>
          <h1 className="text-2xl font-bold font-serif italic text-[#1A2B3C] mt-1">Relatório Fotográfico de Vistoria</h1>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/public/r/${token}/confirmar`}
            className="bg-[#00AEEF] hover:bg-[#009ACD] text-white px-5 py-2 rounded-full font-medium text-xs transition-colors shadow-[0_4px_6px_-1px_rgba(0,174,239,0.1)]"
          >
            Assinar / Confirmar Recebimento
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-12 px-6 space-y-12">
        {/* Card do Imóvel */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Rua XV de Novembro, 1234 - Ap 302</h2>
          <p className="text-xs text-slate-400">Centro, Blumenau - SC</p>
          
          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase">Locatário</p>
              <p className="font-bold text-sm">João da Silva</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase">Locador</p>
              <p className="font-bold text-sm">Imobiliária Blumenau</p>
            </div>
          </div>
        </div>

        {/* Ambientes do Relatório */}
        <div className="space-y-8">
          <h3 className="text-lg font-bold font-serif italic">Condições por Ambiente</h3>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-md font-bold border-b border-slate-50 pb-2">Cozinha</h4>

            <div className="space-y-4">
              <div className="border-b border-slate-50 pb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold text-sm">Torneira da Pia</h5>
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded px-2 py-0.5">Bom Estado</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-prose">
                  Torneira metálica cromada de bica alta instalada. Apresenta funcionamento normal, sem vazamentos constatados nas conexões ou no registro. Acabamento brilhante sem riscos profundos.
                </p>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-slate-400">Verificado via IA Multimodal</span>
                  <Link href={`/public/r/${token}/contestar/torneira`} className="text-red-500 hover:underline font-semibold">
                    Contestar este item
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer no Rodapé */}
        <footer className="text-center text-[10px] text-slate-400 max-w-lg mx-auto pt-6 space-y-2">
          <p>
            <strong>Aviso Legal:</strong> A Facilita Vistorias atua na prestação de serviços de documentação técnica fotográfica independente de condições de imóveis. Este documento não constitui laudo técnico pericial de engenharia regulado pelo CREA, tendo finalidade informativa e comprobatória para fins de locação.
          </p>
        </footer>
      </main>
    </div>
  );
}
