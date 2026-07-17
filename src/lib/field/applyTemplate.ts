import {
  getDB,
  type LocalAmbiente,
  type LocalItem,
} from "@/lib/db/idb";
import {
  defaultItemsForRoomName,
  getPropertyTemplate,
  type PropertyTemplate,
} from "@/lib/field/templates";

export class TemplateApplyError extends Error {
  code: "ALREADY_HAS_ROOMS" | "UNKNOWN_TEMPLATE" | "NO_DB" | "EMPTY";

  constructor(
    code: TemplateApplyError["code"],
    message: string,
  ) {
    super(message);
    this.name = "TemplateApplyError";
    this.code = code;
  }
}

function newLocalId(prefix: string, salt: number): string {
  return `${prefix}-${Date.now()}-${salt}-${Math.random().toString(36).slice(2, 8)}`;
}

async function enqueueCreateAmbiente(
  vistoriaId: string,
  ambiente: LocalAmbiente,
) {
  const db = await getDB();
  if (!db) return;
  await db.put("mutation_queue", {
    action: "CREATE_AMBIENTE_LOCAL",
    vistoriaId,
    payload: { ambiente },
    timestamp: Date.now(),
  });
}

async function enqueueCreateItem(vistoriaId: string, item: LocalItem) {
  const db = await getDB();
  if (!db) return;
  await db.put("mutation_queue", {
    action: "CREATE_ITEM_LOCAL",
    vistoriaId,
    payload: { item },
    timestamp: Date.now(),
  });
}

async function createRoomWithItems(
  vistoriaId: string,
  nome: string,
  ordem: number,
  itemNames: string[],
): Promise<{ ambiente: LocalAmbiente; items: LocalItem[] }> {
  const db = await getDB();
  if (!db) {
    throw new TemplateApplyError("NO_DB", "IndexedDB não disponível");
  }

  const now = new Date().toISOString();
  const ambiente: LocalAmbiente = {
    id: newLocalId("amb-local", ordem),
    nome,
    ordem,
    vistoriaId,
    createdAt: now,
    updatedAt: now,
  };

  await db.put("ambientes", ambiente);
  await enqueueCreateAmbiente(vistoriaId, ambiente);

  const items: LocalItem[] = [];
  for (let j = 0; j < itemNames.length; j++) {
    const item: LocalItem = {
      id: newLocalId("item-local", ordem * 100 + j),
      nome: itemNames[j],
      descricao: null,
      descricaoFinal: null,
      descricaoEditada: false,
      status: "PENDENTE",
      ambienteId: ambiente.id,
      createdAt: now,
      updatedAt: now,
    };
    await db.put("items", item);
    await enqueueCreateItem(vistoriaId, item);
    items.push(item);
  }

  return { ambiente, items };
}

/**
 * Applies a full property template. Fails if the inspection already has rooms (D-02).
 */
export async function applyPropertyTemplate(
  vistoriaId: string,
  templateId: string,
): Promise<{ ambientes: number; items: number; template: PropertyTemplate }> {
  const template = getPropertyTemplate(templateId);
  if (!template) {
    throw new TemplateApplyError(
      "UNKNOWN_TEMPLATE",
      "Modelo de imóvel não encontrado",
    );
  }

  const db = await getDB();
  if (!db) {
    throw new TemplateApplyError("NO_DB", "IndexedDB não disponível");
  }

  const existing = (await db.getAll("ambientes")).filter(
    (a) => a.vistoriaId === vistoriaId,
  );
  if (existing.length > 0) {
    throw new TemplateApplyError(
      "ALREADY_HAS_ROOMS",
      "Esta vistoria já tem cômodos. Use “+ Cômodo” ou remova os existentes antes de aplicar um modelo.",
    );
  }

  if (template.rooms.length === 0) {
    throw new TemplateApplyError("EMPTY", "Modelo sem cômodos");
  }

  let itemCount = 0;
  for (let i = 0; i < template.rooms.length; i++) {
    const r = template.rooms[i];
    const { items } = await createRoomWithItems(
      vistoriaId,
      r.nome,
      i + 1,
      r.itens,
    );
    itemCount += items.length;
  }

  return {
    ambientes: template.rooms.length,
    items: itemCount,
    template,
  };
}

/**
 * Creates one room with default items for that room type (D-03).
 */
export async function createAmbienteWithDefaultItems(
  vistoriaId: string,
  nome: string,
  ordem?: number,
): Promise<{ ambiente: LocalAmbiente; items: LocalItem[] }> {
  const db = await getDB();
  if (!db) {
    throw new TemplateApplyError("NO_DB", "IndexedDB não disponível");
  }

  const existing = (await db.getAll("ambientes")).filter(
    (a) => a.vistoriaId === vistoriaId,
  );
  const nextOrdem =
    ordem ??
    (existing.length > 0
      ? Math.max(...existing.map((a) => a.ordem)) + 1
      : 1);

  const itemNames = defaultItemsForRoomName(nome);
  return createRoomWithItems(vistoriaId, nome.trim(), nextOrdem, itemNames);
}
