/**
 * Brazilian CPF validation (módulo 11) and helpers — Phase 5 D-03.
 */

/** Strip non-digits. */
export function stripCpf(value: string): string {
  return value.replace(/\D/g, "");
}

/** Format as 000.000.000-00 when 11 digits. */
export function formatCpf(value: string): string {
  const d = stripCpf(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Validates CPF with check digits (módulo 11).
 * Rejects empty, wrong length, and known invalid sequences (all same digit).
 */
export function isValidCpf(value: string): boolean {
  const cpf = stripCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string, factorStart: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * (factorStart - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  if (d1 !== Number(cpf[9])) return false;
  const d2 = calcDigit(cpf.slice(0, 10), 11);
  if (d2 !== Number(cpf[10])) return false;
  return true;
}

/** Last 3 digits for audit UI (never full CPF). */
export function cpfUltimos3(value: string): string {
  const cpf = stripCpf(value);
  return cpf.slice(-3);
}
