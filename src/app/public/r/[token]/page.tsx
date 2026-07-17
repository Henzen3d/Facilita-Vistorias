import QRCode from "qrcode";
import { RelatorioFotograficoView } from "@/components/report/RelatorioFotograficoView";
import { loadPublicReportByToken } from "@/lib/report/load-public-report";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ print?: string }>;
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

  // D-14: default public view is capa + PDF download only.
  // ?print=1 enables full template for Puppeteer PDF (D-09–D-13).
  return (
    <RelatorioFotograficoView
      report={report}
      mode={isPrint ? "print" : "public"}
      qrDataUrl={qrDataUrl}
    />
  );
}
