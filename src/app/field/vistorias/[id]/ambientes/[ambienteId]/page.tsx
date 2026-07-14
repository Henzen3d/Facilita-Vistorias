import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string }>;
}

export default async function FieldAmbienteDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const { id, ambienteId } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <Link href={`/field/vistorias/${id}/ambientes`} className="text-xs text-slate-500 hover:underline">
          ← Ambientes
        </Link>
        <span className="font-bold text-sm capitalize">{ambienteId.replace("-", " ")}</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Adicionar Novo Item */}
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Itens do Ambiente</h3>
          <Link
            href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/novo`}
            className="text-xs bg-[#00AEEF] hover:bg-[#009ACD] text-white px-3 py-1 rounded-full font-semibold"
          >
            + Adicionar
          </Link>
        </div>

        {/* Lista de Itens */}
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm">Torneira da Pia</h4>
              <p className="text-[10px] text-slate-400">Estado: Bom | 1 Foto e 1 Áudio</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/torneira/revisao`}
                className="text-xs text-[#00AEEF] border border-[#00AEEF]/20 px-2.5 py-1 rounded-full font-semibold hover:bg-slate-50"
              >
                Rever
              </Link>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm">Porta de Entrada</h4>
              <p className="text-[10px] text-slate-400">Estado: Desgaste natural | 2 Fotos</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/porta/revisao`}
                className="text-xs text-[#00AEEF] border border-[#00AEEF]/20 px-2.5 py-1 rounded-full font-semibold hover:bg-slate-50"
              >
                Rever
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
