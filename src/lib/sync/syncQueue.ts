"use client";

import { getDB, MutationQueueItem } from "@/lib/db/idb";

export async function addMutationToQueue(
  action: MutationQueueItem["action"],
  vistoriaId: string,
  payload: any
): Promise<number | undefined> {
  try {
    const db = await getDB();
    if (!db) return undefined;

    const queueItem: MutationQueueItem = {
      action,
      vistoriaId,
      payload,
      timestamp: Date.now()
    };

    const tx = db.transaction("mutation_queue", "readwrite");
    const id = await tx.objectStore("mutation_queue").add(queueItem);
    await tx.done;

    return id;
  } catch (err) {
    console.error("Erro ao enfileirar mutação offline:", err);
    return undefined;
  }
}

export async function getPendingMutations(): Promise<MutationQueueItem[]> {
  try {
    const db = await getDB();
    if (!db) return [];

    return await db.getAll("mutation_queue");
  } catch (err) {
    console.error("Erro ao listar mutações pendentes:", err);
    return [];
  }
}

export async function removeMutationFromQueue(id: number): Promise<boolean> {
  try {
    const db = await getDB();
    if (!db) return false;

    const tx = db.transaction("mutation_queue", "readwrite");
    await tx.objectStore("mutation_queue").delete(id);
    await tx.done;
    
    return true;
  } catch (err) {
    console.error(`Erro ao remover mutação #${id} da fila:`, err);
    return false;
  }
}
