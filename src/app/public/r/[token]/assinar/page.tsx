import Link from "next/link";
import { redirect } from "next/navigation";
import { AssinarForm } from "@/components/report/AssinarForm";
import { loadPublicReportByToken } from "@/lib/report/load-public-report";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AssinarRelatorioPage({ params }: PageProps) {
  const { token } = await params;
  const report = await loadPublicReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-secondary">
            Relatório não encontrado
          </h1>
          <p className="text-sm text-slate-500">
            Verifique o link recebido ou solicite um novo acesso.
          </p>
        </div>
      </div>
    );
  }

  if (report.jaAssinado) {
    redirect(`/public/r/${token}/audit`);
  }

  if (!report.podeAssinar) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-secondary">
            Assinatura indisponível
          </h1>
          <p className="text-sm text-slate-600">
            {!report.jaConfirmado
              ? "Confirme o recebimento do relatório antes de assinar."
              : "Não é possível assinar enquanto houver contestações em andamento ou o status não permitir."}
          </p>
          <Link
            href={`/public/r/${token}`}
            className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-full bg-secondary text-white text-sm font-bold"
          >
            Voltar ao relatório
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Assinatura eletrônica
          </p>
          <h1 className="text-2xl font-bold text-secondary">
            Assinar relatório fotográfico
          </h1>
          <p className="text-sm text-slate-500">
            {report.empresa.nome} · {report.vistoria.codigo}
          </p>
        </header>

        <AssinarForm
          token={token}
          nomePreenchido={report.relatorio?.nomeQuemConfirmou}
        />

        <p className="text-[11px] text-slate-400 leading-relaxed">
          A assinatura gera um registro de auditoria (IP, data/hora, hash
          SHA-256) com validade de assinatura eletrônica simples (MP nº
          2.200-2/2001 e Lei nº 14.063/2020). O CPF é armazenado de forma
          protegida (hash), não em texto puro.
        </p>
      </div>
    </div>
  );
}
