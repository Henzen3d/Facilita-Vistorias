import { describe, expect, it } from "vitest";
import { computeCompletionScore } from "@/lib/field/completionScore";
import {
  defaultItemsForRoomName,
  getPropertyTemplate,
  PROPERTY_TEMPLATES,
} from "@/lib/field/templates";
import { findNextPending } from "@/lib/field/itemNavigation";
import type { LocalItem } from "@/lib/db/idb";

describe("templates catalog", () => {
  it("exposes core property templates", () => {
    const ids = PROPERTY_TEMPLATES.map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining(["studio", "apto-1", "apto-2", "apto-3", "casa"]),
    );
  });

  it("apto-2 has multiple rooms with items", () => {
    const t = getPropertyTemplate("apto-2");
    expect(t).toBeDefined();
    expect(t!.rooms.length).toBeGreaterThanOrEqual(5);
    expect(t!.rooms.every((r) => r.itens.length > 0)).toBe(true);
  });

  it("defaultItemsForRoomName matches bathroom family", () => {
    const items = defaultItemsForRoomName("Banheiro social");
    expect(items).toContain("Chuveiro");
    expect(items).toContain("Vaso sanitário");
  });
});

describe("computeCompletionScore D-05 photo gate", () => {
  const baseItem = (id: string, status: LocalItem["status"]): LocalItem => ({
    id,
    nome: `Item ${id}`,
    descricao: null,
    descricaoFinal: null,
    descricaoEditada: false,
    status,
    ambienteId: "amb-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it("blocks finalize when items lack photos", () => {
    const score = computeCompletionScore({
      vistoriaId: "vis-1",
      checklist: null,
      ambientes: [
        {
          id: "amb-1",
          nome: "Sala",
          ordem: 1,
          vistoriaId: "vis-1",
          createdAt: "",
          updatedAt: "",
        },
      ],
      items: [baseItem("i1", "BOM"), baseItem("i2", "BOM")],
      midias: [
        {
          id: "m1",
          tipo: "FOTO",
          url: "blob:1",
          key: "k1",
          itemId: "i1",
          uploadedAt: "",
          syncStatus: "PENDENTE",
        },
      ],
    });

    expect(score.canFinalize).toBe(false);
    expect(score.stats.itemsWithoutPhoto).toBe(1);
    expect(score.issues.some((i) => i.id === "missing-photos")).toBe(true);
  });

  it("allows finalize when every item has status and photo", () => {
    const score = computeCompletionScore({
      vistoriaId: "vis-1",
      checklist: null,
      ambientes: [
        {
          id: "amb-1",
          nome: "Sala",
          ordem: 1,
          vistoriaId: "vis-1",
          createdAt: "",
          updatedAt: "",
        },
      ],
      items: [baseItem("i1", "BOM"), baseItem("i2", "REGULAR")],
      midias: [
        {
          id: "m1",
          tipo: "FOTO",
          url: "blob:1",
          key: "k1",
          itemId: "i1",
          uploadedAt: "",
          syncStatus: "SYNCED",
        },
        {
          id: "m2",
          tipo: "FOTO",
          url: "blob:2",
          key: "k2",
          itemId: "i2",
          uploadedAt: "",
          syncStatus: "SYNCED",
        },
      ],
    });

    expect(score.canFinalize).toBe(true);
    expect(score.stats.itemsWithoutPhoto).toBe(0);
  });
});

describe("findNextPending", () => {
  it("returns next pending after current without wrap", () => {
    const mk = (id: string, status: LocalItem["status"]) => ({
      item: {
        id,
        nome: id,
        descricao: null,
        descricaoFinal: null,
        descricaoEditada: false,
        status,
        ambienteId: "a",
        createdAt: "",
        updatedAt: "",
      },
      ambienteId: "a",
      ambienteNome: "Sala",
      ordemAmbiente: 1,
    });

    const list = [
      mk("i1", "BOM"),
      mk("i2", "PENDENTE"),
      mk("i3", "PENDENTE"),
    ];
    expect(findNextPending("i1", list)?.item.id).toBe("i2");
    expect(findNextPending("i2", list)?.item.id).toBe("i3");
    expect(findNextPending("i3", list)).toBeNull();
  });
});
