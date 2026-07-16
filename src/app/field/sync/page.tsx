"use client";

import React, { useEffect, useState } from "react";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
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
        // Load all midias
        const allMidias = await db.getAll("midias");
        setMidias(allMidias);

        // Load items and environments to resolve names
        const allItems = await db.getAll("items");
        const allAmbientes = await db.getAll("ambientes");
        
        const namesMap: Record<string, string> = {};
        allItems.forEach(item => {
          const amb = allAmbientes.find(a => a.id === item.ambienteId);
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
    // Update local list every 3 seconds to reflect sync status changes
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalFiles = midias.length;
  const localCount = midias.filter(m => m.syncStatus !== "SYNCED").length;
  const syncedCount = totalFiles - localCount;
  const pct = totalFiles > 0 ? Math.round((syncedCount / totalFiles) * 100) : 100;

  return (
    <PhoneShell showNav={true}>
      <TopBar title="Sincronização" backTo="/field" />

      {/* Offline banner */}
      {!isOnline && (
        <div className="mx-5 rounded-3xl bg-accent/15 border border-accent/30 px-4 py-3 flex items-center gap-3 select-none">
          <Icon name="wifi_off" className="text-accent text-[22px]" />
          <div className="flex-1">
            <p className="text-xs font-bold text-secondary">Trabalhando Offline</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Suas fotos e áudios estão seguros no aparelho e sincronizarão assim que detectar internet.
            </p>
          </div>
        </div>
      )}

      {/* General Sync Status Card */}
      <div className="px-5 mt-5">
        <div className="rounded-3xl bg-secondary text-white p-5 flex items-center gap-4 shadow-lg shadow-secondary/15">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Icon name="cloud_sync" className={`text-primary text-[30px] ${syncing ? "animate-spin" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Status geral</p>
            <p className="text-sm font-bold truncate mt-0.5">
              {syncedCount} sincronizados · {localCount} pendentes
            </p>
            <div className="mt-2.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 bg-status-bad/10 border border-status-bad/20 p-3 rounded-2xl text-center select-none">
          <p className="text-[11px] font-bold text-status-bad">{error}</p>
        </div>
      )}

      {/* Files List */}
      <div className="px-5 mt-6 flex-1 flex flex-col">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 select-none">
          Arquivos na Fila
        </h2>

        {loading ? (
          <div className="flex-1 flex justify-center py-12">
            <Icon name="progress_activity" className="text-2xl text-slate-300 animate-spin" />
          </div>
        ) : midias.length === 0 ? (
          <div className="flex-1 border border-slate-100 rounded-3xl bg-white p-8 text-center flex flex-col items-center justify-center gap-2 select-none">
            <Icon name="cloud_done" className="text-3xl text-slate-300" />
            <p className="text-xs font-bold text-secondary">Tudo sincronizado</p>
            <p className="text-[10px] text-slate-400">Nenhuma imagem ou áudio pendente de envio.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {midias.map((m) => {
              const name = itemNames[m.itemId] || "Item de Vistoria";
              const sizeLabel = m.tipo === "AUDIO" ? "Áudio Gravado" : "Foto Capturada";

              return (
                <li
                  key={m.id}
                  className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Icon
                      name={m.tipo === "FOTO" ? "image" : "graphic_eq"}
                      className="text-secondary text-[20px]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-secondary truncate">{name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sizeLabel}</p>
                  </div>
                  <StatusBadge status={m.syncStatus} syncing={syncing && m.syncStatus !== "SYNCED"} />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Manual Sync Button */}
      {localCount > 0 && (
        <div className="px-5 mt-6 pb-6 select-none">
          <button
            onClick={syncNow}
            disabled={syncing || !isOnline}
            className="w-full h-14 rounded-full bg-primary hover:bg-[#009acd] text-white font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Icon name={syncing ? "progress_activity" : "cloud_upload"} className={`text-[22px] ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        </div>
      )}
    </PhoneShell>
  );
}

function StatusBadge({ status, syncing }: { status: LocalMidia["syncStatus"]; syncing: boolean }) {
  if (status === "SYNCED") {
    return (
      <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-status-good/10 text-status-good text-[10px] font-bold uppercase tracking-wide select-none">
        <Icon name="cloud_done" className="text-[16px]" />
        Sincronizado
      </span>
    );
  }
  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide select-none animate-pulse">
        <Icon name="cloud_sync" className="text-[16px]" />
        Enviando
      </span>
    );
  }
  if (status === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-status-bad/10 text-status-bad text-[10px] font-bold uppercase tracking-wide select-none">
        <Icon name="error" className="text-[16px]" />
        Erro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-bold uppercase tracking-wide select-none">
      <Icon name="save" className="text-[16px]" />
      Local
    </span>
  );
}
