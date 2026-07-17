import { describe, expect, it } from "vitest";
import {
  buildWhatsAppReportUrl,
  contestacaoDeadline,
  isContestacaoOpen,
  normalizeBrazilPhone,
} from "@/lib/report/whatsapp";

describe("whatsapp helpers", () => {
  it("normalizes BR phones", () => {
    expect(normalizeBrazilPhone("(47) 99999-1111")).toBe("5547999991111");
    expect(normalizeBrazilPhone("5547999991111")).toBe("5547999991111");
    expect(normalizeBrazilPhone("")).toBeNull();
  });

  it("builds wa.me with report url", () => {
    const url = buildWhatsAppReportUrl({
      reportUrl: "https://app.example/public/r/abc",
      codigo: "VIS-1",
      enderecoResumo: "Rua X, 1",
    });
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("VIS-1");
    expect(decodeURIComponent(url)).toContain("https://app.example/public/r/abc");
  });

  it("contest window uses enviadoEm then geradoEm", () => {
    const gerado = new Date("2026-07-01T12:00:00Z");
    const enviado = new Date("2026-07-02T12:00:00Z");
    const d = contestacaoDeadline(enviado, gerado, 7);
    expect(d?.toISOString().startsWith("2026-07-09")).toBe(true);
    expect(isContestacaoOpen(enviado, gerado, new Date("2026-07-05T00:00:00Z"))).toBe(
      true,
    );
    expect(isContestacaoOpen(enviado, gerado, new Date("2026-07-20T00:00:00Z"))).toBe(
      false,
    );
  });
});
