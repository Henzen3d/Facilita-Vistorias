import { z } from "zod";

/**
 * Structured multimodal description output.
 * itemState uses human-facing Portuguese labels; map to Prisma via mapItemStateToPrisma.
 */
export const DescriptionOutputSchema = z.object({
  itemState: z.enum(["Novo", "Bom", "Regular", "Ruim"]),
  technicalDescription: z
    .string()
    .min(1, "technicalDescription is required")
    .describe(
      "Descrição técnica e objetiva do item na foto. NÃO use as palavras laudo, laudo técnico ou perícia."
    ),
});

export type DescriptionOutput = z.infer<typeof DescriptionOutputSchema>;

/** Metadata required by AnaliseIa persistence (Plan 03-03). */
export type AiRunMeta = {
  provider: "GEMINI" | "OPENAI" | "CLAUDE";
  usedFallback: boolean;
  latencyMs: number;
  guardrailHit: boolean;
};

export type AiResult<T> = {
  data: T;
  meta: AiRunMeta;
};

/** Map human-facing itemState labels to Prisma EstadoConservacao enum values. */
export function mapItemStateToPrisma(
  state: DescriptionOutput["itemState"]
): "NOVO" | "BOM" | "REGULAR" | "RUIM" {
  const map = {
    Novo: "NOVO",
    Bom: "BOM",
    Regular: "REGULAR",
    Ruim: "RUIM",
  } as const;
  return map[state];
}

/** Alias expected by plan behavior block. */
export const mapItemStateToEnum = mapItemStateToPrisma;
