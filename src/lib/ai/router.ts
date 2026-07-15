import Anthropic from "@anthropic-ai/sdk";
import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
} from "@google/generative-ai";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import {
  enforceDescriptionOutput,
  containsRegulatedTerms,
} from "./guardrails";
import { downscaleImageBuffer } from "./image";
import {
  buildDescriptionUserText,
  STT_PROMPT,
  SYSTEM_DESCRIPTION_PROMPT,
} from "./prompts";
import type { AiResult, AiRunMeta, DescriptionOutput } from "./schemas";

export type { AiResult, AiRunMeta } from "./schemas";

/** Primary Gemini model — match env.example (GEMINI_MODEL=gemini-2.0-flash). */
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const DEFAULT_OPENAI_AUDIO = "whisper-1";
const DEFAULT_OPENAI_VISION = "gpt-4o-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const PROVIDER_TIMEOUT_MS = 10_000;
const DESCRIPTION_TEMPERATURE = 0.1;
const DESCRIPTION_MAX_TOKENS = 300;

function isFailoverError(error: unknown): boolean {
  if (!error || typeof error !== "object") return true;
  const e = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
    name?: string;
  };
  const status = e.status ?? e.statusCode;
  if (status === 429 || status === 503) return true;
  if (e.name === "AbortError" || e.code === "ABORT_ERR") return true;
  const msg = (e.message || "").toLowerCase();
  if (msg.includes("timeout") || msg.includes("aborted")) return true;
  // Treat any provider failure as failover trigger (free-tier first strategy)
  return true;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const err = new Error(`${label} timed out after ${ms}ms`);
          (err as { code?: string }).code = "ABORT_ERR";
          (err as { name?: string }).name = "AbortError";
          reject(err);
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  return "bin";
}

/**
 * Thin multi-provider AI router.
 * Free-tier Gemini first → OpenAI (Whisper / gpt-4o-mini) → optional Claude.
 *
 * LOCKED CONTRACT: both methods return { data, meta } only.
 * FORBIDDEN: lastRunMeta, bare string/DescriptionOutput returns, dual styles.
 */
export class AIRouter {
  private gemini: GoogleGenerativeAI;
  private openai: OpenAI;
  private anthropic: Anthropic | null;

  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    this.openai = new OpenAI({
      apiKey:
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_AUTH_TOKEN ||
        "",
      // Do not append /v1 — SDK adds path segments
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    const anthropicKey =
      process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || "";
    this.anthropic = anthropicKey
      ? new Anthropic({
          apiKey: anthropicKey,
          baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
        })
      : null;
  }

  private geminiModelName(): string {
    return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  }

  private getGeminiTextModel(): GenerativeModel {
    return this.gemini.getGenerativeModel({ model: this.geminiModelName() });
  }

  private getGeminiJsonModel(): GenerativeModel {
    return this.gemini.getGenerativeModel({
      model: this.geminiModelName(),
      generationConfig: {
        temperature: DESCRIPTION_TEMPERATURE,
        maxOutputTokens: DESCRIPTION_MAX_TOKENS,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            itemState: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["Novo", "Bom", "Regular", "Ruim"],
            },
            technicalDescription: { type: SchemaType.STRING },
          },
          required: ["itemState", "technicalDescription"],
        },
      },
    });
  }

  /**
   * Stage 1 — STT. Gemini free-tier first, Whisper fallback.
   * Returns { data: transcript, meta } only.
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<AiResult<string>> {
    const started = Date.now();

    try {
      const model = this.getGeminiTextModel();
      const result = await withTimeout(
        model.generateContent([
          {
            inlineData: {
              mimeType,
              data: audioBuffer.toString("base64"),
            },
          },
          STT_PROMPT,
        ]),
        PROVIDER_TIMEOUT_MS,
        "Gemini STT"
      );
      const text = result.response.text()?.trim() ?? "";
      if (!text) {
        throw new Error("Gemini STT returned empty transcript");
      }
      const meta: AiRunMeta = {
        provider: "GEMINI",
        usedFallback: false,
        latencyMs: Date.now() - started,
        guardrailHit: false,
      };
      // Log provider + latency only — never full base64 media (T-03-06)
      console.info("[AIRouter] transcribeAudio", {
        provider: meta.provider,
        latencyMs: meta.latencyMs,
        usedFallback: meta.usedFallback,
      });
      return { data: text, meta };
    } catch (primaryError) {
      if (!isFailoverError(primaryError)) throw primaryError;
      console.warn(
        "[AIRouter] Gemini STT failed, falling back to Whisper",
        primaryError instanceof Error ? primaryError.message : primaryError
      );
    }

    try {
      const file = await toFile(
        audioBuffer,
        `audio.${extensionForMime(mimeType)}`,
        { type: mimeType }
      );
      const transcription = await withTimeout(
        this.openai.audio.transcriptions.create({
          file,
          model: process.env.OPENAI_AUDIO_MODEL || DEFAULT_OPENAI_AUDIO,
          language: "pt",
        }),
        PROVIDER_TIMEOUT_MS,
        "OpenAI Whisper"
      );
      const text = transcription.text?.trim() ?? "";
      if (!text) {
        throw new Error("Whisper returned empty transcript");
      }
      const meta: AiRunMeta = {
        provider: "OPENAI",
        usedFallback: true,
        latencyMs: Date.now() - started,
        guardrailHit: false,
      };
      console.info("[AIRouter] transcribeAudio", {
        provider: meta.provider,
        latencyMs: meta.latencyMs,
        usedFallback: meta.usedFallback,
      });
      return { data: text, meta };
    } catch (fallbackError) {
      console.error(
        "[AIRouter] All STT providers failed",
        fallbackError instanceof Error ? fallbackError.message : fallbackError
      );
      throw fallbackError;
    }
  }

  /**
   * Stage 2 — multimodal description. Gemini first → OpenAI → optional Claude.
   * Photos are downscaled to max 1024 before any provider call.
   * Returns { data: DescriptionOutput, meta } only.
   */
  async generateDescription(
    photoBuffer: Buffer,
    mimeType: string,
    transcript: string
  ): Promise<AiResult<DescriptionOutput>> {
    const started = Date.now();
    const resized = await downscaleImageBuffer(photoBuffer, mimeType, 1024);
    const userText = buildDescriptionUserText(transcript);
    const base64 = resized.buffer.toString("base64");

    // --- Primary: Gemini multimodal ---
    try {
      const model = this.getGeminiJsonModel();
      const result = await withTimeout(
        model.generateContent([
          SYSTEM_DESCRIPTION_PROMPT,
          userText,
          {
            inlineData: {
              mimeType: resized.mimeType,
              data: base64,
            },
          },
        ]),
        PROVIDER_TIMEOUT_MS,
        "Gemini description"
      );
      const rawText = result.response.text();
      const preSanitizeHadTerms =
        typeof rawText === "string" && containsRegulatedTerms(rawText);
      const data = enforceDescriptionOutput(rawText);
      const guardrailHit =
        preSanitizeHadTerms ||
        containsRegulatedTerms(
          // detect if sanitize changed meaning by re-checking original parse path
          typeof rawText === "string" ? rawText : ""
        );
      const meta: AiRunMeta = {
        provider: "GEMINI",
        usedFallback: false,
        latencyMs: Date.now() - started,
        guardrailHit,
      };
      console.info("[AIRouter] generateDescription", {
        provider: meta.provider,
        latencyMs: meta.latencyMs,
        usedFallback: meta.usedFallback,
        guardrailHit: meta.guardrailHit,
      });
      return { data, meta };
    } catch (geminiError) {
      if (!isFailoverError(geminiError)) throw geminiError;
      console.warn(
        "[AIRouter] Gemini description failed, falling back to OpenAI",
        geminiError instanceof Error ? geminiError.message : geminiError
      );
    }

    // --- Fallback: OpenAI vision ---
    try {
      const response = await withTimeout(
        this.openai.chat.completions.create({
          model: process.env.OPENAI_VISION_MODEL || DEFAULT_OPENAI_VISION,
          temperature: DESCRIPTION_TEMPERATURE,
          max_tokens: DESCRIPTION_MAX_TOKENS,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_DESCRIPTION_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${resized.mimeType};base64,${base64}`,
                  },
                },
              ],
            },
          ],
        }),
        PROVIDER_TIMEOUT_MS,
        "OpenAI description"
      );
      const content = response.choices[0]?.message?.content || "{}";
      const preSanitizeHadTerms = containsRegulatedTerms(content);
      const data = enforceDescriptionOutput(content);
      const meta: AiRunMeta = {
        provider: "OPENAI",
        usedFallback: true,
        latencyMs: Date.now() - started,
        guardrailHit: preSanitizeHadTerms,
      };
      console.info("[AIRouter] generateDescription", {
        provider: meta.provider,
        latencyMs: meta.latencyMs,
        usedFallback: meta.usedFallback,
        guardrailHit: meta.guardrailHit,
      });
      return { data, meta };
    } catch (openaiError) {
      console.warn(
        "[AIRouter] OpenAI description failed",
        openaiError instanceof Error ? openaiError.message : openaiError
      );
      if (!this.anthropic) {
        throw openaiError;
      }
    }

    // --- Optional third: Anthropic Claude ---
    if (!this.anthropic) {
      throw new Error("All AI description providers failed");
    }

    try {
      const mediaType = this.anthropicImageMediaType(resized.mimeType);
      const response = await withTimeout(
        this.anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
          max_tokens: DESCRIPTION_MAX_TOKENS,
          temperature: DESCRIPTION_TEMPERATURE,
          system: SYSTEM_DESCRIPTION_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: `${userText}\n\nResponda apenas JSON com itemState e technicalDescription.`,
                },
              ],
            },
          ],
        }),
        PROVIDER_TIMEOUT_MS,
        "Claude description"
      );
      const textBlock = response.content.find((b) => b.type === "text");
      const content =
        textBlock && textBlock.type === "text" ? textBlock.text : "{}";
      const preSanitizeHadTerms = containsRegulatedTerms(content);
      const data = enforceDescriptionOutput(content);
      const meta: AiRunMeta = {
        provider: "CLAUDE",
        usedFallback: true,
        latencyMs: Date.now() - started,
        guardrailHit: preSanitizeHadTerms,
      };
      console.info("[AIRouter] generateDescription", {
        provider: meta.provider,
        latencyMs: meta.latencyMs,
        usedFallback: meta.usedFallback,
        guardrailHit: meta.guardrailHit,
      });
      return { data, meta };
    } catch (claudeError) {
      console.error(
        "[AIRouter] All description providers failed",
        claudeError instanceof Error ? claudeError.message : claudeError
      );
      throw claudeError;
    }
  }

  private anthropicImageMediaType(
    mimeType: string
  ): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
    if (mimeType === "image/png") return "image/png";
    if (mimeType === "image/gif") return "image/gif";
    if (mimeType === "image/webp") return "image/webp";
    return "image/jpeg";
  }
}
