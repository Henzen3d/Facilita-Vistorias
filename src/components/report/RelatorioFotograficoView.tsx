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

function hasAnyMedidor(
  m: NonNullable<PublicReportDto["medidores"]>,
): boolean {
  return Boolean(
    m.aguaNumero ||
      m.aguaLeitura ||
      m.energiaNumero ||
      m.energiaLeitura ||
      m.gasNumero ||
      m.gasLeitura ||
      m.observacoes,
  );
}

/**
 * Shared HTML template for public digital report and Puppeteer PDF (D-10).
 * Public mode (Phase 4): capa + download + galeria de itens + CTAs.
 * Print mode: capa + medidores + 1 item/page + QR (D-09, D-13).
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
  const token = report.token;

  return (
    <div
      className={`min-h-screen bg-background-light text-secondary font-sans ${
        isPrint ? "print-root" : "relative"
      }`}
    >
      {!isPrint && (
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 -left-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        </div>
      )}

      {/* —— CAPA —— */}
      <section
        className={
          isPrint
            ? "report-page cover-page flex flex-col min-h-[100vh] bg-white px-10 py-12"
            : "relative max-w-2xl mx-auto py-12 px-6"
        }
      >
        <header className="border-b border-slate-100/80 pb-6 mb-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Documentação técnica
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary mt-1">
            Relatório{" "}
            <span className="text-accent-editorial font-normal">fotográfico</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{report.empresa.nome}</p>
        </header>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Imóvel
            </p>
            <h2 className="text-lg font-bold mt-0.5 text-secondary leading-snug">
              {formatEndereco(report.imovel)}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 pt-4">
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Código</p>
              <p className="font-bold text-sm text-secondary">{report.vistoria.codigo}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Tipo</p>
              <p className="font-bold text-sm text-secondary">{report.vistoria.tipo}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Data</p>
              <p className="font-bold text-sm text-secondary">
                {formatData(report.vistoria.data)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Itens</p>
              <p className="font-bold text-sm text-secondary tabular-nums">{flatItems.length}</p>
            </div>
          </div>

          {report.pessoas.length > 0 && (
            <div className="border-t border-slate-50 pt-4 grid grid-cols-2 gap-3 text-xs">
              {report.pessoas.map((p) => (
                <div key={`${p.tipo}-${p.nome}`}>
                  <p className="text-slate-400 font-semibold uppercase tracking-wide">
                    {pessoaLabel(p.tipo)}
                  </p>
                  <p className="font-bold text-sm text-secondary">{p.nome}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Public mode: PDF + status + client CTAs (Phase 4) */}
        {!isPrint && (
          <div className="mt-8 space-y-4">
            {report.relatorio?.pdfDownloadUrl ? (
              <a
                href={report.relatorio.pdfDownloadUrl}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full font-bold text-sm transition-colors shadow-soft"
                download
              >
                Baixar PDF do relatório fotográfico
              </a>
            ) : (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
                O PDF ainda está sendo gerado. Atualize esta página em instantes.
              </div>
            )}
            {report.relatorio?.versaoAtual ? (
              <p className="text-xs text-slate-400">
                Versão {report.relatorio.versaoAtual}
                {report.relatorio.geradoEm
                  ? ` · gerado em ${formatData(report.relatorio.geradoEm)}`
                  : ""}
                {report.relatorio.status
                  ? ` · status ${report.relatorio.status}`
                  : ""}
              </p>
            ) : null}

            {report.jaConfirmado && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900 text-sm">
                Recebimento confirmado
                {report.relatorio?.nomeQuemConfirmou
                  ? ` por ${report.relatorio.nomeQuemConfirmou}`
                  : ""}
                {report.relatorio?.confirmadoEm
                  ? ` em ${formatData(report.relatorio.confirmadoEm)}`
                  : ""}
                .
              </div>
            )}

            {report.jaAssinado && (
              <div className="rounded-2xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-secondary text-sm space-y-2">
                <p>
                  Documento assinado eletronicamente
                  {report.relatorio?.assinaturaNome
                    ? ` por ${report.relatorio.assinaturaNome}`
                    : ""}
                  {report.relatorio?.assinadoEm
                    ? ` em ${formatData(report.relatorio.assinadoEm)}`
                    : ""}
                  .
                </p>
                <a
                  href={`/public/r/${token}/audit`}
                  className="inline-flex font-bold text-sm underline"
                >
                  Ver registro de auditoria
                </a>
              </div>
            )}

            {!report.jaConfirmado && !report.jaAssinado && (
              <a
                href={`/public/r/${token}/confirmar`}
                className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] rounded-full border-2 border-status-good text-status-good font-bold text-sm hover:bg-green-50 transition-colors"
              >
                Confirmar recebimento do relatório
              </a>
            )}

            {report.podeAssinar && (
              <a
                href={`/public/r/${token}/assinar`}
                className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] rounded-full bg-secondary text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
              >
                Assinar documento
              </a>
            )}

            {report.contestacaoAberta && report.contestacaoPrazoAte && (
              <p className="text-xs text-slate-500">
                Você pode contestar itens até{" "}
                <strong>{formatData(report.contestacaoPrazoAte)}</strong>.
              </p>
            )}
            {!report.contestacaoAberta && !report.jaConfirmado && (
              <p className="text-xs text-slate-500">
                O prazo para contestar itens encerrou ou não está disponível.
              </p>
            )}
          </div>
        )}

        {/* Discreet CREA disclaimer (D-12) — not a banner */}
        <p className="mt-10 text-[11px] leading-relaxed text-slate-400 max-w-prose">
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

      {/* —— PUBLIC: gallery by room (Phase 4) —— */}
      {!isPrint &&
        report.ambientes.map((ambiente) => (
          <section
            key={ambiente.id}
            className="relative max-w-2xl mx-auto px-6 pb-8"
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              {ambiente.nome}
            </h2>
            <ul className="space-y-4">
              {ambiente.items.map((item) => {
                const thumb = item.fotos[0];
                return (
                  <li
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                  >
                    {thumb && (
                      <div className="aspect-[16/10] bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb.url}
                          alt={item.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-secondary">
                          {item.nome}
                        </h3>
                        {item.estadoConservacao && (
                          <span
                            className={`text-[10px] font-bold uppercase rounded px-2 py-0.5 shrink-0 ${estadoBadgeClass(
                              item.estadoConservacao,
                            )}`}
                          >
                            {item.estadoConservacao}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {item.descricaoFinal || "Sem descrição técnica."}
                      </p>
                      {item.contestacaoStatus && (
                        <p className="text-xs font-semibold text-slate-500">
                          Contestação: {item.contestacaoStatus}
                        </p>
                      )}
                      {item.podeContestar ? (
                        <a
                          href={`/public/r/${token}/contestar/${item.id}`}
                          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-full border border-red-200 text-red-700 text-sm font-bold hover:bg-red-50 transition-colors"
                        >
                          Contestar este item
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {!isPrint && flatItems.length === 0 && (
        <p className="relative max-w-2xl mx-auto px-6 pb-12 text-sm text-slate-500 text-center">
          Nenhum item com mídia completa neste relatório ainda.
        </p>
      )}

      {/* —— PRINT: medidores page (Phase 3.2) —— */}
      {isPrint && report.medidores && hasAnyMedidor(report.medidores) && (
        <section className="report-page break-before-page flex flex-col min-h-[100vh] bg-white px-10 py-12">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Concessionárias
          </p>
          <h2 className="text-xl font-bold mt-1 mb-6">Leituras de medidores</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-3 font-bold">Tipo</th>
                <th className="py-2 pr-3 font-bold">Nº medidor</th>
                <th className="py-2 font-bold">Leitura</th>
              </tr>
            </thead>
            <tbody className="text-secondary">
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-3 font-semibold">Água</td>
                <td className="py-3 pr-3">{report.medidores.aguaNumero || "—"}</td>
                <td className="py-3">{report.medidores.aguaLeitura || "—"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-3 font-semibold">Energia</td>
                <td className="py-3 pr-3">{report.medidores.energiaNumero || "—"}</td>
                <td className="py-3">{report.medidores.energiaLeitura || "—"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-3 font-semibold">Gás</td>
                <td className="py-3 pr-3">{report.medidores.gasNumero || "—"}</td>
                <td className="py-3">{report.medidores.gasLeitura || "—"}</td>
              </tr>
            </tbody>
          </table>
          {report.medidores.observacoes && (
            <div className="mt-6">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Observações
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {report.medidores.observacoes}
              </p>
            </div>
          )}
        </section>
      )}

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

      {/* —— PRINT: electronic signature audit page (Phase 5) —— */}
      {isPrint &&
        report.jaAssinado &&
        report.relatorio?.assinadoEm && (
          <section className="report-page break-before-page flex flex-col min-h-[100vh] bg-white px-10 py-12">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Validade jurídica
            </p>
            <h2 className="text-xl font-bold mt-1 mb-6">
              Registro de Assinatura Eletrônica
            </h2>

            {report.relatorio.assinaturaImagem && (
              <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.relatorio.assinaturaImagem}
                  alt="Assinatura"
                  className="max-h-28 object-contain mx-auto"
                />
              </div>
            )}

            <table className="w-full text-sm border-collapse">
              <tbody className="text-secondary">
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-400 font-semibold w-36">
                    Nome
                  </td>
                  <td className="py-2 font-semibold">
                    {report.relatorio.assinaturaNome || "—"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-400 font-semibold">
                    Data
                  </td>
                  <td className="py-2">
                    {new Date(report.relatorio.assinadoEm).toLocaleString(
                      "pt-BR",
                      { dateStyle: "long", timeStyle: "medium" },
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-400 font-semibold">IP</td>
                  <td className="py-2 font-mono text-xs">
                    {report.relatorio.assinaturaIp || "—"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-400 font-semibold">
                    Dispositivo
                  </td>
                  <td className="py-2 text-xs break-all">
                    {report.relatorio.assinaturaDevice || "—"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-400 font-semibold">
                    CPF (parcial)
                  </td>
                  <td className="py-2 font-mono text-xs">
                    ***.***.***-
                    {report.relatorio.assinaturaCpfUltimos || "•••"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-400 font-semibold align-top">
                    Hash SHA-256
                  </td>
                  <td className="py-2 font-mono text-[10px] break-all">
                    {report.relatorio.assinaturaHash || "—"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-auto pt-10 flex flex-col items-center border-t border-slate-100">
              {qrDataUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QR de verificação da auditoria"
                    width={120}
                    height={120}
                  />
                  <p className="text-[9px] text-slate-400 mt-2 text-center max-w-xs">
                    Escaneie para verificar o registro de auditoria online
                    (/public/r/…/audit)
                  </p>
                </>
              )}
              <p className="text-[10px] text-slate-400 mt-4 text-center max-w-md leading-relaxed">
                Documento com validade de assinatura eletrônica simples — MP nº
                2.200-2/2001 e Lei nº 14.063/2020.
              </p>
            </div>
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
