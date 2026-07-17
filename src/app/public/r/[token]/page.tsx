import QRCode from "qrcode";
import { RelatorioFotograficoView } from "@/components/report/RelatorioFotograficoView";
import { loadPublicReportByToken } from "@/lib/report/load-public-report";
import { trackPublicReportView } from "@/lib/report/track-public-view";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ print?: string; contestado?: string; confirmado?: string }>;
}

function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function PublicReportDetail({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const isPrint = sp.print === "1" || sp.print === "true";

  const report = await loadPublicReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-secondary">
            Relatório não encontrado ou link expirado
          </h1>
          <p className="text-sm text-slate-500 max-w-prose mx-auto">
            Verifique o link recebido ou solicite um novo acesso à imobiliária /
            responsável pela vistoria.
          </p>
        </div>
      </div>
    );
  }

  // Phase 4 D-07: count views only on client public page (not Puppeteer print)
  if (!isPrint) {
    await trackPublicReportView(report.vistoria.id);
  }

  const publicUrl = `${appBaseUrl()}/public/r/${token}`;
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: isPrint ? 280 : 128,
      errorCorrectionLevel: "M",
    });
  } catch {
    qrDataUrl = null;
  }

  return (
    <>
      {!isPrint && (sp.contestado === "1" || sp.confirmado === "1") && (
        <div className="bg-status-good/10 border-b border-status-good/20 text-status-good text-sm font-semibold text-center py-3 px-4">
          {sp.confirmado === "1"
            ? "Recebimento confirmado com sucesso."
            : "Contestação enviada. A equipe analisará em breve."}
        </div>
      )}
      <RelatorioFotograficoView
        report={report}
        mode={isPrint ? "print" : "public"}
        qrDataUrl={qrDataUrl}
      />
    </>
  );
}
