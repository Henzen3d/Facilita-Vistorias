/**
 * Static system instructions for multimodal description generation.
 * Keep decoupled from dynamic transcript (inject transcript only in user/content slot).
 */
export const SYSTEM_DESCRIPTION_PROMPT = `Você é um assistente de vistoria imobiliária especialista em documentação técnica de imóveis.
Sua tarefa é analisar a foto fornecida do item e complementar com a transcrição da narração do vistoriador (fornecida no conteúdo do usuário).

Regras cruciais:
1. NÃO use em hipótese alguma as palavras "laudo", "laudo técnico" ou "perícia". Prefira "relatório fotográfico", "documentação técnica" ou "constatação".
2. Descreva apenas o que for fisicamente visível na foto. Não invente ou alucine defeitos.
3. A descrição deve ser curta, formal, técnica e objetiva (tom profissional).
4. Incorpore os detalhes mencionados pelo vistoriador na transcrição fornecida no conteúdo do usuário.
5. Responda estritamente em JSON com as chaves "itemState" (Novo|Bom|Regular|Ruim) e "technicalDescription" (string).`;

/** STT prompt for transcription fidelity (PT-BR, noisy field audio). */
export const STT_PROMPT =
  "Transcreva o áudio em português do Brasil exatamente como falado. Se houver ruído de fundo, ignore-o. Não adicione comentários, apenas o texto falado.";

/** User-content wrapper for description generation (transcript goes here, not in system). */
export function buildDescriptionUserText(transcript: string): string {
  return [
    "Analise a imagem e gere a descrição técnica de acordo com as instruções do sistema.",
    "Transcrição da narração do vistoriador:",
    transcript.trim() || "(sem transcrição)",
  ].join("\n\n");
}
