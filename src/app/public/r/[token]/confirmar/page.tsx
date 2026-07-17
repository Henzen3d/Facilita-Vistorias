import Link from "next/link";
import { loadPublicReportByToken } from "@/lib/report/load-public-report";
import { ConfirmForm } from "./ConfirmForm";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicReportConfirm({ params }: PageProps) {
  const { token } = await params;
  const report = await loadPublicReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">Relatório não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-secondary font-sans flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Confirmação de recebimento
          </span>
          <h2 className="text-xl font-bold">Confirmar recebimento</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ao confirmar, você declara que recebeu e revisou o relatório
            fotográfico {report.vistoria.codigo}. Isso não é assinatura digital
            certificada (ICP-Brasil).
          </p>
        </div>

        {report.jaConfirmado ? (
          <div className="space-y-4">
            <p className="text-sm text-status-good bg-green-50 border border-status-good/20 rounded-2xl px-4 py-3 text-center">
              Já confirmado
              {report.relatorio?.nomeQuemConfirmou
                ? ` por ${report.relatorio.nomeQuemConfirmou}`
                : ""}
              .
            </p>
            <Link
              href={`/public/r/${token}`}
              className="block text-center rounded-full bg-secondary text-white py-3 text-sm font-bold"
            >
              Voltar ao relatório
            </Link>
          </div>
        ) : (
          <ConfirmForm token={token} />
        )}
      </div>
    </div>
  );
}
