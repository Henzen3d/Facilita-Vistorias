import { describe, expect, it } from "vitest";
import { cpfUltimos3, formatCpf, isValidCpf, stripCpf } from "@/lib/report/cpf";

describe("cpf validation", () => {
  it("strips non-digits", () => {
    expect(stripCpf("529.982.247-25")).toBe("52998224725");
  });

  it("formats while typing", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("accepts a valid CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("rejects all-same digits", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("rejects wrong check digits", () => {
    expect(isValidCpf("529.982.247-00")).toBe(false);
  });

  it("returns last 3 digits", () => {
    expect(cpfUltimos3("52998224725")).toBe("725");
  });
});
