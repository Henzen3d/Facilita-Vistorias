import type { PublicReportDto } from "@/lib/report/load-public-report";

export type RelatorioFotograficoViewProps = {
  report: PublicReportDto;
  /**
   * `public` — D-14 minimal: capa + download PDF only
   * `print`  — D-09–D-13 full layout for Puppeteer (capa + 1 item/page + QR)
   */
  mode?: "public" | "print";
  /** QR data URL for cover (discreet) and last page (prominent) */
  qrDataUrl?: string | null;
};

function formatEndereco(imovel: PublicReportDto["imovel"]): string {
  const line1 = [imovel.endereco, imovel.numero, imovel.complemento]
    .filter(Boolean)
    .join(", ");
  const line2 = `${imovel.bairro}, ${imovel.cidade} - ${imovel.estado}`;
  return `${line1} — ${line2}`;
}

function formatData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function pessoaLabel(tipo: string): string {
  switch (tipo) {
    case "LOCATARIO":
      return "Locatário";
    case "LOCADOR":
      return "Locador";
    case "PROPRIETARIO":
      return "Proprietário";
    case "FIADOR":
      return "Fiador";
    default:
      return tipo;
  }
}

function estadoBadgeClass(estado: string | null): string {
  switch (estado) {
    case "NOVO":
    case "BOM":
      return "bg-emerald-100 text-emerald-800";
    case "REGULAR":
      return "bg-amber-100 text-amber-800";
    case "RUIM":
    case "PESSIMO":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/**
 * Shared HTML template for public digital report and Puppeteer PDF (D-10).
 * Default public mode is minimal cover + PDF download (D-14).
 * Print mode renders capa + one item per page + QR placements (D-09, D-13).
 */
export function RelatorioFotograficoView({
  report,
  mode = "public",
  qrDataUrl,
}: RelatorioFotograficoViewProps) {
  const isPrint = mode === "print";
  const flatItems = report.ambientes.flatMap((a) =>
    a.items.map((item) => ({ ambiente: a.nome, item })),
  );

  return (
    <div
      className={`min-h-screen bg-[#F8FAFC] text-[#1A2B3C] font-sans ${
        isPrint ? "print-root" : ""
      }`}
    >
      {/* —— CAPA —— */}
      <section
        className={
          isPrint
            ? "report-page cover-page flex flex-col min-h-[100vh] bg-white px-10 py-12"
            : "max-w-2xl mx-auto py-12 px-6"
        }
      >
        <header className="border-b border-slate-100 pb-6 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#00AEEF]">
            Documentação técnica
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A2B3C] mt-1">
            Relatório Fotográfico
          </h1>
          <p className="text-sm text-slate-500 mt-1">{report.empresa.nome}</p>
        </header>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Imóvel
            </p>
            <h2 className="text-lg font-bold mt-0.5">
              {formatEndereco(report.imovel)}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 pt-4">
            <div>
              <p className="text-slate-400 font-semibold uppercase">Código</p>
              <p className="font-bold text-sm">{report.vistoria.codigo}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase">Tipo</p>
              <p className="font-bold text-sm">{report.vistoria.tipo}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase">Data</p>
              <p className="font-bold text-sm">
                {formatData(report.vistoria.data)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase">Itens</p>
              <p className="font-bold text-sm">{flatItems.length}</p>
            </div>
          </div>

          {report.pessoas.length > 0 && (
            <div className="border-t border-slate-50 pt-4 grid grid-cols-2 gap-3 text-xs">
              {report.pessoas.map((p) => (
                <div key={`${p.tipo}-${p.nome}`}>
                  <p className="text-slate-400 font-semibold uppercase">
                    {pessoaLabel(p.tipo)}
                  </p>
                  <p className="font-bold text-sm">{p.nome}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Public mode (D-14): download only — no item gallery, no contest CTAs */}
        {!isPrint && (
          <div className="mt-8 space-y-4">
            {report.relatorio?.pdfDownloadUrl ? (
              <a
                href={report.relatorio.pdfDownloadUrl}
                className="inline-flex items-center justify-center w-full sm:w-auto bg-[#00AEEF] hover:bg-[#009ACD] text-white px-6 py-3 rounded-full font-medium text-sm transition-colors shadow-sm"
                download
              >
                Baixar PDF do Relatório Fotográfico
              </a>
            ) : (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
                O PDF ainda está sendo gerado. Atualize esta página em instantes.
              </div>
            )}
            {report.relatorio?.versaoAtual ? (
              <p className="text-[11px] text-slate-400">
                Versão {report.relatorio.versaoAtual}
                {report.relatorio.geradoEm
                  ? ` · gerado em ${formatData(report.relatorio.geradoEm)}`
                  : ""}
              </p>
            ) : null}
          </div>
        )}

        {/* Discreet CREA disclaimer (D-12) — not a banner */}
        <p className="mt-10 text-[9px] leading-relaxed text-slate-400 max-w-md">
          Documentação técnica fotográfica com finalidade informativa para
          locação. Este documento não constitui laudo técnico pericial de
          engenharia regulado pelo CREA.
        </p>

        {/* Discreet QR on cover (D-13) */}
        {isPrint && qrDataUrl && (
          <div className="mt-auto pt-8 flex items-end justify-end">
            <div className="text-right">
              <img
                src={qrDataUrl}
                alt="QR do relatório digital"
                width={64}
                height={64}
                className="opacity-80 ml-auto"
              />
              <p className="text-[8px] text-slate-400 mt-1">Versão digital</p>
            </div>
          </div>
        )}
      </section>

      {/* —— PRINT: one item per page (D-09) —— */}
      {isPrint &&
        flatItems.map(({ ambiente, item }, index) => {
          const isLast = index === flatItems.length - 1;
          const primaryFoto = item.fotos[0];
          return (
            <section
              key={item.id}
              className="report-page item-page break-before-page flex flex-col min-h-[100vh] bg-white px-10 py-12"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {ambiente}
              </p>
              <div className="flex items-center justify-between gap-3 mt-1 mb-4">
                <h2 className="text-xl font-bold">{item.nome}</h2>
                {item.estadoConservacao && (
                  <span
                    className={`text-[10px] font-bold uppercase rounded px-2 py-0.5 ${estadoBadgeClass(
                      item.estadoConservacao,
                    )}`}
                  >
                    {item.estadoConservacao}
                  </span>
                )}
              </div>

              {primaryFoto ? (
                <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100 min-h-[40vh]">
                  <img
                    src={primaryFoto.url}
                    alt={item.nome}
                    className="max-h-[55vh] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex-1 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                  Sem foto
                </div>
              )}

              <div className="mt-6">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Descrição técnica
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {item.descricaoFinal || "—"}
                </p>
              </div>

              {item.fotos.length > 1 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {item.fotos.slice(1).map((f) => (
                    <img
                      key={f.id}
                      src={f.url}
                      alt=""
                      className="w-16 h-16 object-cover rounded border border-slate-100"
                    />
                  ))}
                </div>
              )}

              {/* Prominent QR on last page (D-13) */}
              {isLast && qrDataUrl && (
                <div className="mt-auto pt-10 flex flex-col items-center border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Acesse a versão digital
                  </p>
                  <img
                    src={qrDataUrl}
                    alt="QR do relatório digital"
                    width={140}
                    height={140}
                  />
                  <p className="text-[9px] text-slate-400 mt-2 max-w-xs text-center">
                    Escaneie para abrir o Relatório Fotográfico online
                  </p>
                </div>
              )}
            </section>
          );
        })}

      {/* Empty print: still show QR page if no items */}
      {isPrint && flatItems.length === 0 && qrDataUrl && (
        <section className="report-page break-before-page flex flex-col items-center justify-center min-h-[100vh] bg-white px-10 py-12">
          <p className="text-sm text-slate-500 mb-4">
            Nenhum item com mídia completa neste relatório.
          </p>
          <img
            src={qrDataUrl}
            alt="QR do relatório digital"
            width={140}
            height={140}
          />
        </section>
      )}

      {isPrint && (
        <style>{`
          @page { size: A4; margin: 12mm; }
          .report-page { page-break-after: always; }
          .report-page:last-child { page-break-after: auto; }
          .break-before-page { break-before: page; page-break-before: always; }
        `}</style>
      )}
    </div>
  );
}
