import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FieldVistoriaDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <Link href="/field" className="text-xs text-slate-500 hover:underline font-medium">
          ← Voltar
        </Link>
        <span className="font-bold text-sm">Vistoria #{id}</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Card de Detalhes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Rua XV de Novembro, 1234</h2>
          <p className="text-xs text-slate-400">Ap 302 - Centro, Blumenau - SC</p>
          
          <div className="border-t border-slate-50 pt-4 space-y-2 text-xs">
            <p><strong className="font-semibold text-slate-500">Tipo:</strong> Vistoria de Entrada</p>
            <p><strong className="font-semibold text-slate-500">Locatário:</strong> João da Silva</p>
            <p><strong className="font-semibold text-slate-500">Locador:</strong> Imobiliária Blumenau</p>
            <p><strong className="font-semibold text-slate-500">Data Agendada:</strong> 14 de Julho de 2026</p>
          </div>
        </div>

        {/* Steps info: Info -> Meters -> Keys -> Rooms -> Documents */}
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 px-2">
          <span className="text-[#00AEEF]">1. Info</span>
          <span>2. Protocolo</span>
          <span>3. Ambientes</span>
          <span>4. Fim</span>
        </div>

        {/* Protocolo de Chegada Trigger */}
        <Link
          href={`/field/vistorias/${id}/ambientes`}
          className="block text-center w-full rounded-full bg-[#00AEEF] py-3 text-white text-sm font-semibold hover:bg-[#009ACD] transition-colors shadow-md"
        >
          Iniciar Protocolo de Chegada
        </Link>
      </main>
    </div>
  );
}
