import Link from "next/link";
import { loadPublicReportByToken } from "@/lib/report/load-public-report";
import { ContestForm } from "./ContestForm";

interface PageProps {
  params: Promise<{ token: string; itemId: string }>;
}

export default async function PublicReportContest({ params }: PageProps) {
  const { token, itemId } = await params;
  const report = await loadPublicReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">Relatório não encontrado.</p>
      </div>
    );
  }

  let itemNome = "Item";
  let ambienteNome = "";
  let pode = false;
  for (const a of report.ambientes) {
    const it = a.items.find((i) => i.id === itemId);
    if (it) {
      itemNome = it.nome;
      ambienteNome = a.nome;
      pode = it.podeContestar;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-background-light text-secondary font-sans flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-md space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Contestação de item
          </span>
          <h2 className="text-xl font-bold text-secondary">{itemNome}</h2>
          {ambienteNome && (
            <p className="text-xs text-slate-400">{ambienteNome}</p>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            Descreva a divergência em relação à documentação técnica fotográfica.
            A equipe Facilita analisará o pedido.
          </p>
        </div>

        {!pode ? (
          <div className="space-y-4">
            <p className="text-sm text-status-warn bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              Este item não pode ser contestado no momento (prazo encerrado,
              relatório confirmado ou contestação já em andamento).
            </p>
            <Link
              href={`/public/r/${token}`}
              className="block text-center rounded-full border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Voltar ao relatório
            </Link>
          </div>
        ) : (
          <ContestForm token={token} itemId={itemId} />
        )}
      </div>
    </div>
  );
}
