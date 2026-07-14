import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminVistoriaDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🔍 Revisão de Vistoria #{id}</h1>
          <p className="text-sm text-slate-500">Revisão final ambiente por ambiente dos itens gerados pela IA</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/vistorias" className="text-slate-500 text-sm hover:underline font-medium flex items-center">
            Voltar
          </Link>
          <button className="rounded-full bg-[#00AEEF] px-5 py-2 text-white font-medium hover:bg-[#009ACD] transition-colors shadow-[0_4px_6px_-1px_rgba(0,174,239,0.1)]">
            Finalizar & Compartilhar
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ambientes e Itens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ambiente 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span>Cozinha</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">100% Concluído</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">Torneira da Pia</h4>
                  <span className="bg-green-100 text-green-800 text-xs font-bold uppercase rounded px-2 py-0.5">Bom</span>
                </div>
                <p className="text-xs text-slate-500">Descrição Gerada pela IA:</p>
                <textarea 
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs h-20"
                  defaultValue="Torneira metálica cromada de bica alta instalada. Apresenta funcionamento normal, sem vazamentos constatados nas conexões ou no registro. Acabamento brilhante sem riscos profundos."
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Provedor: Gemini Flash (Multimodal)</span>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" defaultChecked={false} /> Modificado manualmente
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Gerais do Imóvel & Checklist de Chegada */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Informações do Imóvel</h3>
            <div className="space-y-2 text-sm">
              <p><strong className="font-semibold text-slate-500">Endereço:</strong> Rua XV de Novembro, 1234 - Ap 302</p>
              <p><strong className="font-semibold text-slate-500">Locatário:</strong> João da Silva</p>
              <p><strong className="font-semibold text-slate-500">Locador:</strong> Imobiliária Blumenau</p>
              <p><strong className="font-semibold text-slate-500">Vistoriador:</strong> Osmar Gonçalves</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">🛡️ Protocolo de Chegada</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Cheiro de Gás:</span>
                <span className="text-green-600 font-bold">✓ OK (Ausente)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Luzes Ligadas:</span>
                <span className="text-green-600 font-bold">✓ Confirmado</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Janelas Abertas:</span>
                <span className="text-green-600 font-bold">✓ Confirmado</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Ar-Condicionado:</span>
                <span className="text-green-600 font-bold">✓ Ligado (Gelando)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Água Quente:</span>
                <span className="text-green-600 font-bold">✓ Testado</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Vasos Sanitários:</span>
                <span className="text-green-600 font-bold">✓ Testado (Descargas)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
