import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicReportConfirm({ params }: PageProps) {
  const resolvedParams = await params;
  const { token } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1A2B3C] font-sans flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00AEEF]">Assinatura de Recebimento</span>
          <h2 className="text-xl font-bold font-serif italic">Confirmar Recebimento</h2>
          <p className="text-xs text-slate-400">Ao assinar, você confirma que recebeu e revisou todas as informações do relatório técnico fotográfico.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Nome Completo do Assinante</label>
            <input type="text" required className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" placeholder="Ex: João da Silva" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Documento (CPF / CNPJ)</label>
            <input type="text" required className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" placeholder="Ex: 000.000.000-00" />
          </div>
          <div className="flex gap-4">
            <Link
              href={`/public/r/${token}`}
              className="flex-1 text-center rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Voltar
            </Link>
            <button
              type="submit"
              className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 py-2.5 text-white font-semibold text-xs transition-colors shadow-md"
            >
              Confirmar & Assinar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
