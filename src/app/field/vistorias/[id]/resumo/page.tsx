"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { getDB, LocalAmbiente, LocalItem, LocalMidia } from "@/lib/db/idb";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FieldVistoriaSummary({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [ambientes, setAmbientes] = useState<LocalAmbiente[]>([]);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [midias, setMidias] = useState<LocalMidia[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        // Load environments
        const allAmbientes = await db.getAll("ambientes");
        const filteredAmbientes = allAmbientes.filter(a => a.vistoriaId === id);
        setAmbientes(filteredAmbientes);

        // Load items
        const allItems = await db.getAll("items");
        const ambIds = filteredAmbientes.map(a => a.id);
        const filteredItems = allItems.filter(i => ambIds.includes(i.ambienteId));
        setItems(filteredItems);

        // Load midias
        const allMidias = await db.getAll("midias");
        const itemIds = filteredItems.map(i => i.id);
        const filteredMidias = allMidias.filter(m => itemIds.includes(m.itemId));
        setMidias(filteredMidias);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do IDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const db = await getDB();
      if (db) {
        // 1. Field capture complete → EM_REVISAO (D-04); never CONCLUIDA/FINALIZADA here
        const vistoria = await db.get("vistorias", id);
        if (vistoria) {
          vistoria.status = "EM_REVISAO";
          await db.put("vistorias", vistoria);
        }

        // 2. Dedicated status-only mutation (T-03-18) — NEVER UPDATE_CHECKLIST
        await db.put("mutation_queue", {
          action: "UPDATE_VISTORIA_STATUS",
          vistoriaId: id,
          payload: { status: "EM_REVISAO" },
          timestamp: Date.now(),
        });

        // 3. Navigate to success page
        router.push(`/field/vistorias/${id}/sucesso`);
      }
    } catch (err) {
      console.error("Erro ao finalizar vistoria:", err);
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <PhoneShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <Icon name="progress_activity" className="text-3xl text-primary animate-spin" />
        </div>
      </PhoneShell>
    );
  }

  // Calculate statistics
  const totalAmbientes = ambientes.length;
  const totalItens = items.length;
  const totalVistoriados = items.filter(i => i.status !== "PENDENTE").length;
  
  const pendingSyncCount = midias.filter(m => m.syncStatus !== "SYNCED").length;
  const isSyncComplete = pendingSyncCount === 0;

  return (
    <PhoneShell showNav={false}>
      <TopBar title="Resumo da Vistoria" backTo={`/field/vistorias/${id}/ambientes`} />

      <main className="flex-1 px-5 pt-2 pb-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Progression Overview Card */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Status de Execução</h3>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Ambientes cadastrados:</span>
                <span className="font-bold text-secondary">{totalAmbientes} cômodos</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Itens vistoriados:</span>
                <span className="font-bold text-secondary">
                  {totalVistoriados} de {totalItens} ({totalItens > 0 ? Math.round((totalVistoriados / totalItens) * 100) : 0}%)
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Mídias capturadas:</span>
                <span className="font-bold text-secondary">
                  {midias.length} mídias ({midias.filter(m => m.tipo === "FOTO").length} fotos, {midias.filter(m => m.tipo === "AUDIO").length} áudios)
                </span>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-3.5">
                <span className="text-slate-500 font-medium">Sincronização:</span>
                {isSyncComplete ? (
                  <span className="text-status-good font-bold flex items-center gap-1">
                    <Icon name="check_circle" className="text-[16px]" />
                    100% Sincronizado
                  </span>
                ) : (
                  <span className="text-status-warn font-bold flex items-center gap-1">
                    <Icon name="error" className="text-[16px]" />
                    {pendingSyncCount} pendentes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sync warning if any */}
          {!isSyncComplete && (
            <div className="bg-status-warn/10 border border-status-warn/20 text-status-warn p-4 rounded-3xl text-xs space-y-1 select-none">
              <p className="font-bold flex items-center gap-1">
                <Icon name="warning" className="text-[16px]" />
                Arquivos pendentes de envio
              </p>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Você tem {pendingSyncCount} mídias que ainda não subiram para o servidor. Vá até a aba 
                <Link href="/field/sync" className="text-primary font-bold hover:underline mx-1">Sincronizar</Link> 
                para realizar o envio quando tiver internet estável.
              </p>
            </div>
          )}

          {/* Finalize card details */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center space-y-3">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Icon name="assignment_turned_in" className="text-[26px]" />
            </div>
            <h3 className="font-bold text-sm text-secondary">Tudo pronto para finalizar?</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Ao finalizar, a vistoria será concluída e enviada para revisão no painel da administração.
            </p>
          </div>
        </div>

        {/* CTA finalize button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background-light via-background-light to-background-light/0 pt-6">
          <button
            onClick={handleFinalize}
            disabled={finalizing || totalVistoriados < totalItens}
            className="w-full h-16 rounded-full bg-primary hover:bg-[#009acd] text-white text-base font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {finalizing ? (
              <>
                <Icon name="progress_activity" className="text-[22px] animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                Finalizar Vistoria
                <Icon name="check" className="text-[22px]" />
              </>
            )}
          </button>
          
          {totalVistoriados < totalItens && (
            <p className="text-center text-[10px] text-slate-400 mt-2 select-none">
              * Você precisa responder todos os itens antes de finalizar.
            </p>
          )}
        </div>
      </main>
    </PhoneShell>
  );
}
