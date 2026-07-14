import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FieldVistoriaSuccess({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1A2B3C] flex flex-col justify-center p-6">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-sm mx-auto text-center space-y-6">
        <div className="text-4xl text-green-500">🎉</div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Vistoria #{id} Concluída!</h2>
          <p className="text-xs text-slate-400">Os dados foram compilados e enviados para revisão no painel da Vera Lúcia.</p>
        </div>

        <div className="space-y-3">
          <a
            href="https://wa.me/5547999999999?text=Olá,%20a%20vistoria%20já%20foi%20realizada!"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full rounded-full bg-[#25D366] hover:bg-[#20ba56] py-2.5 text-white font-medium text-xs transition-colors shadow-sm"
          >
            💬 Enviar pelo WhatsApp
          </a>

          <Link
            href="/field"
            className="block text-center w-full rounded-full bg-slate-800 hover:bg-slate-900 py-2.5 text-white font-medium text-xs transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
