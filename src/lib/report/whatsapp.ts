/**
 * WhatsApp deep-link helpers for sharing the public report (Phase 4).
 */

export function normalizeBrazilPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  if (digits.length >= 12) return digits;
  return null;
}

export function buildWhatsAppReportUrl(opts: {
  phone?: string | null;
  reportUrl: string;
  codigo: string;
  enderecoResumo?: string;
}): string {
  const lines = [
    `Olá! Segue o *relatório fotográfico* da vistoria ${opts.codigo}.`,
  ];
  if (opts.enderecoResumo) {
    lines.push(`Imóvel: ${opts.enderecoResumo}`);
  }
  lines.push("");
  lines.push("Acesse a versão digital e o PDF:");
  lines.push(opts.reportUrl);
  lines.push("");
  lines.push(
    "Se notar alguma divergência em um item, use a opção Contestar no link.",
  );

  const text = encodeURIComponent(lines.join("\n"));
  const phone = opts.phone ? normalizeBrazilPhone(opts.phone) : null;
  if (phone) {
    return `https://wa.me/${phone}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

/** Default contest window after send/generate (days). */
export function contestacaoPrazoDias(): number {
  const n = Number(process.env.CONTESTACAO_PRAZO_DIAS ?? "7");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 7;
}

export function contestacaoDeadline(
  enviadoEm: Date | null | undefined,
  geradoEm: Date | null | undefined,
  prazoDias = contestacaoPrazoDias(),
): Date | null {
  const base = enviadoEm ?? geradoEm ?? null;
  if (!base) return null;
  const d = new Date(base);
  d.setDate(d.getDate() + prazoDias);
  return d;
}

export function isContestacaoOpen(
  enviadoEm: Date | null | undefined,
  geradoEm: Date | null | undefined,
  now = new Date(),
): boolean {
  const deadline = contestacaoDeadline(enviadoEm, geradoEm);
  if (!deadline) return true; // no report dates yet → allow
  return now.getTime() <= deadline.getTime();
}
