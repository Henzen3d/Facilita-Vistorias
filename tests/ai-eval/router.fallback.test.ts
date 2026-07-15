import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn();
const getGenerativeModelMock = vi.fn(() => ({
  generateContent: generateContentMock,
}));

const whisperCreateMock = vi.fn();
const chatCompletionsCreateMock = vi.fn();

vi.mock("@google/generative-ai", () => {
  class GoogleGenerativeAI {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_apiKey: string) {}
    getGenerativeModel = getGenerativeModelMock;
  }
  return {
    GoogleGenerativeAI,
    SchemaType: {
      OBJECT: "object",
      STRING: "string",
    },
  };
});

vi.mock("openai", () => {
  class OpenAI {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_opts?: unknown) {}
    audio = {
      transcriptions: {
        create: whisperCreateMock,
      },
    };
    chat = {
      completions: {
        create: chatCompletionsCreateMock,
      },
    };
  }
  return { default: OpenAI };
});

vi.mock("openai/uploads", () => ({
  toFile: vi.fn(async (buffer: Buffer, name: string, opts?: { type?: string }) => ({
    buffer,
    name,
    type: opts?.type,
  })),
}));

vi.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_opts?: unknown) {}
    messages = {
      create: vi.fn(),
    };
  }
  return { default: Anthropic };
});

vi.mock("@/lib/ai/image", () => ({
  downscaleImageBuffer: vi.fn(async (buffer: Buffer, mimeType: string) => ({
    buffer,
    mimeType: mimeType.startsWith("image/") ? mimeType : "image/jpeg",
  })),
}));

import { AIRouter } from "@/lib/ai/router";
import { containsRegulatedTerms } from "@/lib/ai/guardrails";

function assertAiResultShape(result: unknown): asserts result is {
  data: unknown;
  meta: {
    provider: string;
    usedFallback: boolean;
    latencyMs: number;
    guardrailHit: boolean;
  };
} {
  expect(result).toBeTypeOf("object");
  expect(result).not.toBeNull();
  expect(Array.isArray(result)).toBe(false);
  expect(result).toHaveProperty("data");
  expect(result).toHaveProperty("meta");
  const r = result as { data: unknown; meta: Record<string, unknown> };
  expect(Object.keys(r).sort()).toEqual(["data", "meta"]);
  expect(r.meta).toMatchObject({
    provider: expect.any(String),
    usedFallback: expect.any(Boolean),
    latencyMs: expect.any(Number),
    guardrailHit: expect.any(Boolean),
  });
}

describe("AIRouter fallback and { data, meta } contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-gemini";
    process.env.OPENAI_API_KEY = "test-openai";
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
  });

  it("falls back to Whisper when Gemini STT throws — usedFallback true, OPENAI", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("Gemini 429 rate limit"));
    whisperCreateMock.mockResolvedValueOnce({
      text: "Torneira com vazamento leve.",
    });

    const router = new AIRouter();
    const result = await router.transcribeAudio(
      Buffer.from("fake-audio"),
      "audio/webm"
    );

    assertAiResultShape(result);
    expect(typeof result.data).toBe("string");
    expect(result.data).toBe("Torneira com vazamento leve.");
    expect(result.meta.usedFallback).toBe(true);
    expect(result.meta.provider).toBe("OPENAI");
    expect(whisperCreateMock).toHaveBeenCalledOnce();
  });

  it("returns GEMINI transcript with usedFallback false when primary succeeds", async () => {
    generateContentMock.mockResolvedValueOnce({
      response: { text: () => "Piso cerâmico sem trincas." },
    });

    const router = new AIRouter();
    const result = await router.transcribeAudio(
      Buffer.from("fake-audio"),
      "audio/webm"
    );

    assertAiResultShape(result);
    expect(result.data).toBe("Piso cerâmico sem trincas.");
    expect(result.meta.usedFallback).toBe(false);
    expect(result.meta.provider).toBe("GEMINI");
    expect(whisperCreateMock).not.toHaveBeenCalled();
  });

  it("sanitizes CREA terms from Gemini description JSON", async () => {
    generateContentMock.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            itemState: "Ruim",
            technicalDescription:
              "Este laudo técnico aponta mancha de umidade na parede.",
          }),
      },
    });

    const router = new AIRouter();
    const result = await router.generateDescription(
      Buffer.from("fake-photo"),
      "image/jpeg",
      "mancha na parede"
    );

    assertAiResultShape(result);
    const data = result.data as {
      itemState: string;
      technicalDescription: string;
    };
    expect(data.itemState).toBe("Ruim");
    expect(containsRegulatedTerms(data.technicalDescription)).toBe(false);
    expect(data.technicalDescription.toLowerCase()).not.toContain("laudo");
    expect(result.meta).toBeDefined();
    expect(result.meta.provider).toBe("GEMINI");
  });

  it("returns schema-valid description with meta.provider when Gemini succeeds", async () => {
    generateContentMock.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            itemState: "Regular",
            technicalDescription: "Piso cerâmico com rejunte manchado.",
          }),
      },
    });

    const router = new AIRouter();
    const result = await router.generateDescription(
      Buffer.from("fake-photo"),
      "image/jpeg",
      "rejunte manchado"
    );

    assertAiResultShape(result);
    expect(result.data).toEqual({
      itemState: "Regular",
      technicalDescription: "Piso cerâmico com rejunte manchado.",
    });
    expect(result.meta.provider).toBeDefined();
    expect(result.meta.provider).toBe("GEMINI");
    expect(result.meta.usedFallback).toBe(false);
  });

  it("never returns bare string from transcribeAudio or bare object from generateDescription", async () => {
    generateContentMock
      .mockResolvedValueOnce({
        response: { text: () => "Áudio limpo." },
      })
      .mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              itemState: "Bom",
              technicalDescription: "Janela de alumínio sem avarias.",
            }),
        },
      });

    const router = new AIRouter();
    const stt = await router.transcribeAudio(Buffer.from("a"), "audio/mp3");
    const desc = await router.generateDescription(
      Buffer.from("p"),
      "image/png",
      "janela ok"
    );

    expect(typeof stt).toBe("object");
    expect(typeof stt).not.toBe("string");
    assertAiResultShape(stt);
    assertAiResultShape(desc);
    expect(stt).toHaveProperty("data");
    expect(stt).toHaveProperty("meta");
    expect(desc).toHaveProperty("data");
    expect(desc).toHaveProperty("meta");
  });
});
