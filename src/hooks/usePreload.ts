"use client";

import { useState, useCallback } from "react";
import { getDB } from "@/lib/db/idb";

export function usePreload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const preloadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      // 1. Fetch data from backend API
      const response = await fetch("/api/vistorias");
      if (!response.ok) {
        throw new Error(`Erro API: ${response.statusText}`);
      }
      
      const vistorias = await response.json();
      setProgress(40);

      // 2. Open local IndexedDB
      const db = await getDB();
      if (!db) {
        throw new Error("Não foi possível inicializar o IndexedDB.");
      }

      setProgress(50);

      // 3. Clear existing local cache and reload everything to maintain fresh state
      const tx = db.transaction(
        ["vistorias", "ambientes", "items", "checklistChegada"],
        "readwrite"
      );

      await tx.objectStore("vistorias").clear();
      await tx.objectStore("ambientes").clear();
      await tx.objectStore("items").clear();
      await tx.objectStore("checklistChegada").clear();
      await tx.done;

      setProgress(70);

      // 4. Save new data inside IndexedDB
      const txSave = db.transaction(
        ["vistorias", "ambientes", "items", "checklistChegada"],
        "readwrite"
      );

      const vStore = txSave.objectStore("vistorias");
      const aStore = txSave.objectStore("ambientes");
      const iStore = txSave.objectStore("items");
      const cStore = txSave.objectStore("checklistChegada");

      for (const v of vistorias) {
        // Extract embedded tables
        const { ambientes, checklistChegada, ...vistoriaBase } = v;

        // Save base vistoria details (includes imovel and pessoas inside)
        await vStore.put(vistoriaBase);

        // Save checklist if available
        if (checklistChegada) {
          await cStore.put(checklistChegada);
        }

        // Save environments and their items
        if (ambientes && Array.isArray(ambientes)) {
          for (const amb of ambientes) {
            const { items, ...ambienteBase } = amb;
            await aStore.put(ambienteBase);

            if (items && Array.isArray(items)) {
              for (const item of items) {
                await iStore.put(item);
              }
            }
          }
        }
      }

      await txSave.done;
      setProgress(100);
    } catch (err: any) {
      console.error("Erro durante preload:", err);
      setError(err.message || "Erro desconhecido ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { preloadData, loading, error, progress };
}
