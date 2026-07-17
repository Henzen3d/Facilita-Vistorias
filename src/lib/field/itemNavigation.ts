import {
  getDB,
  type LocalAmbiente,
  type LocalItem,
} from "@/lib/db/idb";

export type OrderedItemRef = {
  item: LocalItem;
  ambienteId: string;
  ambienteNome: string;
  ordemAmbiente: number;
};

export function buildItemPath(
  vistoriaId: string,
  ambienteId: string,
  itemId: string,
): string {
  return `/field/vistorias/${vistoriaId}/ambientes/${ambienteId}/itens/${itemId}`;
}

export async function listOrderedItems(
  vistoriaId: string,
): Promise<OrderedItemRef[]> {
  const db = await getDB();
  if (!db) return [];

  const ambientes = (await db.getAll("ambientes"))
    .filter((a) => a.vistoriaId === vistoriaId)
    .sort((a, b) => a.ordem - b.ordem);

  const allItems = await db.getAll("items");
  const result: OrderedItemRef[] = [];

  for (const amb of ambientes) {
    const roomItems = allItems
      .filter((i) => i.ambienteId === amb.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    for (const item of roomItems) {
      result.push({
        item,
        ambienteId: amb.id,
        ambienteNome: amb.nome,
        ordemAmbiente: amb.ordem,
      });
    }
  }

  return result;
}

/**
 * Next pending item after `currentItemId` in walk order (same room first, then later rooms).
 * No wrap-around (plan 3.1).
 */
export function findNextPending(
  currentItemId: string,
  list: OrderedItemRef[],
): OrderedItemRef | null {
  const idx = list.findIndex((r) => r.item.id === currentItemId);
  const start = idx >= 0 ? idx + 1 : 0;
  for (let i = start; i < list.length; i++) {
    if (list[i].item.status === "PENDENTE") {
      return list[i];
    }
  }
  return null;
}

export async function findNextPendingAfterSave(
  vistoriaId: string,
  currentItemId: string,
): Promise<OrderedItemRef | null> {
  const list = await listOrderedItems(vistoriaId);
  // Current item is already saved as non-PENDENTE in IDB; skip it and any other done items after.
  return findNextPending(currentItemId, list);
}

export function firstPendingInRoom(
  items: LocalItem[],
): LocalItem | undefined {
  return items
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .find((i) => i.status === "PENDENTE");
}

export type { LocalAmbiente };
