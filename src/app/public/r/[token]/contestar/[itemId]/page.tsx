import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string; itemId: string }>;
}

export default async function PublicReportContest({ params }: PageProps) {
  const resolvedParams = await params;
  const { token, itemId } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1A2B3C] font-sans flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-md space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00AEEF]">Contestação de Item</span>
          <h2 className="text-xl font-bold font-serif italic capitalize">Contestar: {itemId.replace("-", " ")}</h2>
          <p className="text-xs text-slate-400">Insira abaixo os detalhes e justificativa da contestação deste item no relatório.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Seu Nome Completo</label>
            <input type="text" required className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" placeholder="Ex: João da Silva" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Justificativa / Comentário</label>
            <textarea required className="w-full rounded-2xl border border-slate-200 p-3 text-sm h-32 focus:outline-none focus:ring-1 focus:ring-[#00AEEF]" placeholder="Descreva de forma clara o motivo da contestação..." />
          </div>
          <div className="flex gap-4">
            <Link
              href={`/public/r/${token}`}
              className="flex-1 text-center rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 py-2.5 text-white font-semibold text-xs transition-colors shadow-md"
            >
              Enviar Contestação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
