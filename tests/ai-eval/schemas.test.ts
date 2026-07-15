import { describe, expect, it } from "vitest";
import {
  DescriptionOutputSchema,
  mapItemStateToEnum,
  mapItemStateToPrisma,
} from "@/lib/ai/schemas";

describe("DescriptionOutputSchema", () => {
  it("accepts valid itemState + technicalDescription", () => {
    const result = DescriptionOutputSchema.parse({
      itemState: "Bom",
      technicalDescription: "Torneira metálica sem vazamentos.",
    });
    expect(result.itemState).toBe("Bom");
    expect(result.technicalDescription).toBe(
      "Torneira metálica sem vazamentos."
    );
  });

  it("rejects missing technicalDescription", () => {
    const result = DescriptionOutputSchema.safeParse({
      itemState: "Bom",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty technicalDescription", () => {
    const result = DescriptionOutputSchema.safeParse({
      itemState: "Regular",
      technicalDescription: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid itemState", () => {
    const result = DescriptionOutputSchema.safeParse({
      itemState: "Excelente",
      technicalDescription: "Piso ok.",
    });
    expect(result.success).toBe(false);
  });
});

describe("mapItemStateToPrisma / mapItemStateToEnum", () => {
  it('maps "Bom" → BOM (Prisma EstadoConservacao)', () => {
    expect(mapItemStateToEnum("Bom")).toBe("BOM");
    expect(mapItemStateToPrisma("Bom")).toBe("BOM");
  });

  it("maps all human labels to Prisma enums", () => {
    expect(mapItemStateToPrisma("Novo")).toBe("NOVO");
    expect(mapItemStateToPrisma("Regular")).toBe("REGULAR");
    expect(mapItemStateToPrisma("Ruim")).toBe("RUIM");
  });
});
