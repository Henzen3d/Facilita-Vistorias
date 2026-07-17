import Link from "next/link";
import { loadPublicReportByToken } from "@/lib/report/load-public-report";

interface PageProps {
  params: Promise<{ token: string }>;
}

function maskIp(ip: string | null): string {
  if (!ip) return "—";
  // IPv4: show first two octets
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xx.xxx`;
  }
  // IPv6 or other: truncate
  if (ip.length > 12) return `${ip.slice(0, 8)}…`;
  return ip;
}

export default async function AuditAssinaturaPage({ params }: PageProps) {
  const { token } = await params;
  const report = await loadPublicReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-secondary">
            Relatório não encontrado
          </h1>
        </div>
      </div>
    );
  }

  const rel = report.relatorio;
  const signed = report.jaAssinado && rel?.assinadoEm;

  return (
    <div className="min-h-screen bg-background-light px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Registro de auditoria
          </p>
          <h1 className="text-2xl font-bold text-secondary">
            Assinatura eletrônica
          </h1>
          <p className="text-sm text-slate-500">
            {report.empresa.nome} · {report.vistoria.codigo}
          </p>
        </header>

        {!signed ? (
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-900">
            Este relatório ainda não possui assinatura eletrônica registrada.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6 space-y-5">
            {rel?.assinaturaImagem && (
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                  Assinatura
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rel.assinaturaImagem}
                  alt="Assinatura do signatário"
                  className="w-full max-h-40 object-contain border border-slate-100 rounded-xl bg-white"
                />
              </div>
            )}

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase font-bold text-slate-400">
                  Nome
                </dt>
                <dd className="font-semibold text-secondary">
                  {rel?.assinaturaNome || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold text-slate-400">
                  CPF (parcial)
                </dt>
                <dd className="font-mono text-secondary">
                  ***.***.***-{rel?.assinaturaCpfUltimos || "•••"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold text-slate-400">
                  Data / hora
                </dt>
                <dd>
                  {rel?.assinadoEm
                    ? new Date(rel.assinadoEm).toLocaleString("pt-BR", {
                        dateStyle: "long",
                        timeStyle: "medium",
                      })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold text-slate-400">
                  IP
                </dt>
                <dd className="font-mono text-xs">
                  {maskIp(rel?.assinaturaIp ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold text-slate-400">
                  Dispositivo
                </dt>
                <dd className="text-xs break-all text-slate-600">
                  {rel?.assinaturaDevice || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold text-slate-400">
                  Hash SHA-256
                </dt>
                <dd className="font-mono text-[11px] break-all text-slate-800">
                  {rel?.assinaturaHash || "—"}
                </dd>
              </div>
            </dl>

            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
              Documento com registro de assinatura eletrônica simples, nos
              termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020. O hash
              acima permite verificar a integridade do ato de assinatura.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {rel?.pdfDownloadUrl && (
            <a
              href={rel.pdfDownloadUrl}
              className="inline-flex items-center justify-center min-h-[48px] rounded-full bg-secondary text-white text-sm font-bold"
            >
              Baixar PDF
            </a>
          )}
          <Link
            href={`/public/r/${token}`}
            className="inline-flex items-center justify-center min-h-[48px] rounded-full border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Voltar ao relatório
          </Link>
        </div>
      </div>
    </div>
  );
}
