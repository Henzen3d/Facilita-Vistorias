"use client";

import { useState, useEffect, useCallback } from "react";
import { getDB } from "@/lib/db/idb";
import { getPendingMutations, removeMutationFromQueue } from "@/lib/sync/syncQueue";

export function useSyncEngine() {
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update online status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        // Auto sync when back online
        syncNow();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Update pending count
  const refreshPendingCount = useCallback(async () => {
    const list = await getPendingMutations();
    setPendingCount(list.length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
    // Poll queue size every 5 seconds as fallback
    const interval = setInterval(refreshPendingCount, 5000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // Synchronize all mutations
  const syncNow = useCallback(async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);
    setError(null);

    try {
      const db = await getDB();
      if (!db) throw new Error("IndexedDB não disponível.");

      let mutations = await getPendingMutations();

      while (mutations.length > 0) {
        const item = mutations[0];

        if (!item.id) {
          mutations.shift();
          continue;
        }

        try {
          if (item.action === "CREATE_MIDIA") {
            const midiaId = item.payload.id;
            // Get local midia details (including raw Blob)
            const localMidia = await db.get("midias", midiaId);

            if (localMidia && localMidia.blob) {
              const formData = new FormData();
              // Recreate file from cached blob
              const file = new File([localMidia.blob], localMidia.key.split("/").pop() || "file.jpg", {
                type: localMidia.blob.type
              });
              
              formData.append("file", file);
              formData.append("tipo", localMidia.tipo);
              formData.append("id", midiaId);

              const res = await fetch(`/api/vistorias/${item.vistoriaId}/itens/${item.payload.itemId}/midia`, {
                method: "POST",
                body: formData,
              });

              if (!res.ok) {
                throw new Error(`Upload falhou: ${res.statusText}`);
              }

              // Update local sync status to SYNCED
              localMidia.syncStatus = "SYNCED";
              await db.put("midias", localMidia);
            }
          } else {
            // Checklist updates, item status updates, or deletes
            const res = await fetch(`/api/vistorias/${item.vistoriaId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: item.action,
                payload: item.payload,
              }),
            });

            if (!res.ok) {
              throw new Error(`Erro ao salvar no servidor: ${res.statusText}`);
            }
          }

          // Successfully processed mutation, remove from local queue
          await removeMutationFromQueue(item.id);
        } catch (itemErr: any) {
          console.error(`Falha ao sincronizar item #${item.id}:`, itemErr);
          
          // Set error status in midia table if it was a file upload fail
          if (item.action === "CREATE_MIDIA") {
            const midiaId = item.payload.id;
            const localMidia = await db.get("midias", midiaId);
            if (localMidia) {
              localMidia.syncStatus = "ERROR";
              await db.put("midias", localMidia);
            }
          }

          setError(`Alguns itens falharam: ${itemErr.message}`);
          break; // Stop loop on failure to prevent continuous retry loop
        }

        // Fetch next mutations
        mutations = await getPendingMutations();
        setPendingCount(mutations.length);
      }
    } catch (err: any) {
      console.error("Erro na engine de sync:", err);
      setError(err.message || "Falha na sincronização.");
    } finally {
      setSyncing(false);
      refreshPendingCount();
    }
  }, [syncing, refreshPendingCount]);

  return { syncNow, syncing, pendingCount, isOnline, error };
}
