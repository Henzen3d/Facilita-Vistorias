import { describe, expect, it } from "vitest";
import {
  containsRegulatedTerms,
  enforceDescriptionOutput,
  sanitizeRegulatedTerms,
} from "@/lib/ai/guardrails";

const REGULATED_RECHECK = /\b(laudo(\s+t[eé]cnico)?|per[ií]cia)\b/i;

describe("containsRegulatedTerms", () => {
  it('detects "laudo técnico"', () => {
    expect(
      containsRegulatedTerms("Este laudo técnico indica umidade.")
    ).toBe(true);
  });

  it('detects bare "laudo"', () => {
    expect(containsRegulatedTerms("O laudo foi emitido.")).toBe(true);
  });

  it('detects "perícia" and "pericia"', () => {
    expect(containsRegulatedTerms("Houve perícia no local.")).toBe(true);
    expect(containsRegulatedTerms("Houve pericia no local.")).toBe(true);
  });

  it('allows clean "relatório fotográfico"', () => {
    expect(
      containsRegulatedTerms("Relatório fotográfico do item")
    ).toBe(false);
  });

  it("allows documentação técnica", () => {
    expect(
      containsRegulatedTerms("Documentação técnica do estado de conservação.")
    ).toBe(false);
  });
});

describe("sanitizeRegulatedTerms", () => {
  it("replaces laudo técnico with documentação técnica", () => {
    const out = sanitizeRegulatedTerms(
      "Este laudo técnico indica manchas."
    );
    expect(out).not.toMatch(REGULATED_RECHECK);
    expect(out.toLowerCase()).toContain("documentação técnica");
  });

  it("replaces perícia with constatação", () => {
    const out = sanitizeRegulatedTerms("Após perícia visual.");
    expect(out).not.toMatch(REGULATED_RECHECK);
    expect(out.toLowerCase()).toContain("constatação");
  });
});

describe("enforceDescriptionOutput", () => {
  it("parses valid object and returns DescriptionOutput", () => {
    const result = enforceDescriptionOutput({
      itemState: "Bom",
      technicalDescription: "Torneira metálica sem vazamentos.",
    });
    expect(result.itemState).toBe("Bom");
    expect(result.technicalDescription).toBe(
      "Torneira metálica sem vazamentos."
    );
  });

  it("strips markdown fences from JSON string", () => {
    const raw = '```json\n{"itemState":"Regular","technicalDescription":"Piso cerâmico intacto."}\n```';
    const result = enforceDescriptionOutput(raw);
    expect(result.itemState).toBe("Regular");
    expect(result.technicalDescription).toBe("Piso cerâmico intacto.");
  });

  it("sanitizes regulated terms so final text has zero matches", () => {
    const result = enforceDescriptionOutput({
      itemState: "Ruim",
      technicalDescription:
        "Este laudo técnico e a perícia apontam trinca na parede.",
    });
    expect(result.technicalDescription).not.toMatch(REGULATED_RECHECK);
    expect(containsRegulatedTerms(result.technicalDescription)).toBe(false);
  });

  it("rejects missing technicalDescription", () => {
    expect(() =>
      enforceDescriptionOutput({ itemState: "Bom" })
    ).toThrow();
  });
});
