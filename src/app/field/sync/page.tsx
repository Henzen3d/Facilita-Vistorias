"use client";

import React, { useEffect, useState } from "react";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { getDB, LocalMidia } from "@/lib/db/idb";

export default function FieldSync() {
  const { syncNow, syncing, isOnline, error } = useSyncEngine();
  const [midias, setMidias] = useState<LocalMidia[]>([]);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        const allMidias = await db.getAll("midias");
        setMidias(allMidias);

        const allItems = await db.getAll("items");
        const allAmbientes = await db.getAll("ambientes");

        const namesMap: Record<string, string> = {};
        allItems.forEach((item) => {
          const amb = allAmbientes.find((a) => a.id === item.ambienteId);
          namesMap[item.id] = amb ? `${amb.nome} · ${item.nome}` : item.nome;
        });

        setItemNames(namesMap);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do IDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalFiles = midias.length;
  const localCount = midias.filter((m) => m.syncStatus !== "SYNCED").length;
  const errorCount = midias.filter((m) => m.syncStatus === "ERROR").length;
  const syncedCount = totalFiles - localCount;
  const pct = totalFiles > 0 ? Math.round((syncedCount / totalFiles) * 100) : 100;

  return (
    <PhoneShell showNav={true}>
      <TopBar title="Sincronização" backTo="/field" />

      <div className="px-5 pb-8 space-y-4">
        {!isOnline && (
          <div className="rounded-3xl bg-accent/15 border border-accent/30 px-4 py-3 flex items-center gap-3">
            <span className="h-11 w-11 rounded-2xl bg-accent/20 text-secondary flex items-center justify-center shrink-0">
              <Icon name="wifi_off" className="text-[22px]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-secondary">Trabalhando offline</p>
              <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                Fotos e áudios ficam seguros no aparelho e sobem quando houver internet.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-secondary text-white p-5 shadow-lg shadow-secondary/15 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Icon
                name="cloud_sync"
                className={`text-primary text-[30px] ${syncing ? "animate-spin" : ""}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/60">Status geral</p>
              <p className="text-base font-bold truncate mt-0.5">
                {syncedCount} sincronizados · {localCount} pendentes
              </p>
              {errorCount > 0 && (
                <p className="text-xs text-red-200 mt-1 font-semibold">
                  {errorCount} com erro
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-white/50 tabular-nums text-right">{pct}%</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
            <p className="text-sm font-bold text-status-bad flex items-center gap-1.5">
              <Icon name="error" className="text-[18px]" />
              Falha na sincronização
            </p>
            <p className="text-sm text-red-700/90 mt-1">{error}</p>
          </div>
        )}

        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Arquivos na fila
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Icon name="progress_activity" className="text-2xl text-slate-300 animate-spin" />
            </div>
          ) : midias.length === 0 ? (
            <div className="border border-slate-100 rounded-3xl bg-white p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-3xl bg-status-good/10 text-status-good flex items-center justify-center">
                <Icon name="cloud_done" className="text-[32px]" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-secondary">Tudo sincronizado</p>
                <p className="text-sm text-slate-500 max-w-[24ch]">
                  Nenhuma imagem ou áudio pendente de envio no aparelho.
                </p>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {midias.map((m) => {
                const name = itemNames[m.itemId] || "Item de vistoria";
                const sizeLabel = m.tipo === "AUDIO" ? "Áudio gravado" : "Foto capturada";

                return (
                  <li
                    key={m.id}
                    className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                  >
                    <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <Icon
                        name={m.tipo === "FOTO" ? "image" : "graphic_eq"}
                        className="text-secondary text-[22px]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-secondary truncate">{name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sizeLabel}</p>
                    </div>
                    <StatusBadge
                      status={m.syncStatus}
                      syncing={syncing && m.syncStatus !== "SYNCED"}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {localCount > 0 && (
          <div className="pt-2 space-y-2">
            {!isOnline && (
              <p className="text-center text-xs text-slate-500">
                Conecte-se à internet para enviar a fila.
              </p>
            )}
            <Button
              onClick={syncNow}
              disabled={syncing || !isOnline}
              fullWidth
              size="lg"
              className="shadow-lg shadow-primary/20"
            >
              <Icon
                name={syncing ? "progress_activity" : "cloud_upload"}
                className={`text-[22px] ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Sincronizando…" : "Sincronizar agora"}
            </Button>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}

function StatusBadge({
  status,
  syncing,
}: {
  status: LocalMidia["syncStatus"];
  syncing: boolean;
}) {
  if (status === "SYNCED") {
    return <Badge tone="good">Sincronizado</Badge>;
  }
  if (syncing) {
    return <Badge tone="primary">Enviando</Badge>;
  }
  if (status === "ERROR") {
    return <Badge tone="bad">Erro</Badge>;
  }
  return <Badge tone="pending">Local</Badge>;
}
