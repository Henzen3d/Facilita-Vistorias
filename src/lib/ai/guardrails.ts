import {
  DescriptionOutputSchema,
  type DescriptionOutput,
} from "./schemas";

/**
 * CREA-regulated terminology — never allowed in technical descriptions.
 * Matches: laudo, laudo técnico, perícia/pericia (case-insensitive, accent-tolerant).
 */
export const REGULATED_TERMS_REGEX =
  /\b(laudo(\s+t[eé]cnico)?|per[ií]cia)\b/gi;

export function containsRegulatedTerms(text: string): boolean {
  REGULATED_TERMS_REGEX.lastIndex = 0;
  return REGULATED_TERMS_REGEX.test(text);
}

/**
 * Replace CREA-regulated terms with safe alternatives.
 * - "laudo" / "laudo técnico" → "documentação técnica"
 * - "perícia" / "pericia" → "constatação"
 */
export function sanitizeRegulatedTerms(text: string): string {
  return text
    .replace(/\blaudo(\s+t[eé]cnico)?\b/gi, "documentação técnica")
    .replace(/\bper[ií]cia\b/gi, "constatação");
}

/** Strip optional markdown code fences (```json ... ```) around model output. */
function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

/**
 * Parse/validate model output, sanitize CREA terms, re-check.
 * Accepts object or JSON string (optionally markdown-fenced).
 */
export function enforceDescriptionOutput(raw: unknown): DescriptionOutput {
  let candidate: unknown = raw;

  if (typeof raw === "string") {
    const stripped = stripMarkdownFences(raw);
    try {
      candidate = JSON.parse(stripped);
    } catch {
      throw new Error("enforceDescriptionOutput: invalid JSON string");
    }
  }

  const parsed = DescriptionOutputSchema.parse(candidate);
  const sanitizedDescription = sanitizeRegulatedTerms(
    parsed.technicalDescription
  );

  if (containsRegulatedTerms(sanitizedDescription)) {
    throw new Error(
      "enforceDescriptionOutput: regulated CREA terms remain after sanitize"
    );
  }

  return {
    itemState: parsed.itemState,
    technicalDescription: sanitizedDescription,
  };
}
