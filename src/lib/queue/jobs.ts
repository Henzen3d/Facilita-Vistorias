/** BullMQ queue name: AI describe pipeline per item (STT + multimodal). */
export const QUEUE_AI_DESCRIBE = "ai-describe-item";

/** BullMQ queue name: PDF generation for a finalized vistoria. */
export const QUEUE_GENERATE_PDF = "generate-pdf";

/**
 * Job payload for AI description of a single item.
 * Processors must re-load Item/Midia from Prisma by id — never trust free-form paths.
 */
export type AiDescribeItemJob = {
  itemId: string;
  vistoriaId: string;
};

/**
 * Job payload for PDF generation of a vistoria relatório fotográfico.
 */
export type GeneratePdfJob = {
  vistoriaId: string;
  requestedByUserId?: string;
};
