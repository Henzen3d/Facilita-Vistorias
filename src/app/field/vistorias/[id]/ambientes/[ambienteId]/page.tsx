"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { getDB, LocalAmbiente, LocalItem, LocalMidia } from "@/lib/db/idb";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string }>;
}

export default function FieldAmbienteDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id, ambienteId } = resolvedParams;
  const router = useRouter();

  const [ambiente, setAmbiente] = useState<LocalAmbiente | null>(null);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [midias, setMidias] = useState<LocalMidia[]>([]);
  const [loading, setLoading] = useState(true);

  // Add custom item modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescricao, setNewItemDescricao] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        // Load the environment
        const amb = await db.get("ambientes", ambienteId);
        if (amb) {
          setAmbiente(amb);
        }

        // Load items for this environment
        const allItems = await db.getAll("items");
        const filteredItems = allItems.filter(i => i.ambienteId === ambienteId);
        setItems(filteredItems);

        // Load all midias to count per item
        const allMidias = await db.getAll("midias");
        setMidias(allMidias);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do IDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ambienteId]);

  // Handle add custom item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || addingItem) return;

    setAddingItem(true);
    try {
      const db = await getDB();
      if (db) {
        const novoId = `item-local-${Date.now()}`;
        const novoItem: LocalItem = {
          id: novoId,
          nome: newItemName.trim(),
          descricao: newItemDescricao.trim() || null,
          descricaoFinal: null,
          descricaoEditada: false,
          status: "PENDENTE",
          ambienteId: ambienteId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.put("items", novoItem);

        // Add to mutation queue
        await db.put("mutation_queue", {
          action: "UPDATE_ITEM_STATUS" as any,
          vistoriaId: id,
          payload: { tipo: "CREATE_ITEM", item: novoItem },
          timestamp: Date.now(),
        });

        setItems(prev => [...prev, novoItem]);
        setNewItemName("");
        setNewItemDescricao("");
        setShowAddItem(false);
      }
    } catch (err) {
      console.error("Erro ao criar item no IDB:", err);
    } finally {
      setAddingItem(false);
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

  if (!ambiente) {
    return (
      <PhoneShell showNav={false}>
        <TopBar title="Ambiente não encontrado" backTo={`/field/vistorias/${id}/ambientes`} />
        <div className="flex-1 flex items-center justify-center p-6 text-center space-y-4">
          <div>
            <div className="h-16 w-16 bg-status-bad/10 text-status-bad rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="error" className="text-[32px]" />
            </div>
            <h3 className="text-base font-bold text-secondary">Ambiente não localizado</h3>
            <Link
              href={`/field/vistorias/${id}/ambientes`}
              className="inline-block mt-4 text-xs font-bold text-primary hover:underline"
            >
              Voltar aos Cômodos
            </Link>
          </div>
        </div>
      </PhoneShell>
    );
  }

  // Helper to count media for an item
  const getItemMediaStats = (itemId: string) => {
    const itemMidias = midias.filter(m => m.itemId === itemId);
    const photos = itemMidias.filter(m => m.tipo === "FOTO").length;
    const audios = itemMidias.filter(m => m.tipo === "AUDIO").length;
    return { photos, audios };
  };

  const getStatusBadge = (status: LocalItem["status"]) => {
    switch (status) {
      case "BOM":
        return "bg-status-good/10 text-status-good border border-status-good/20";
      case "REGULAR":
        return "bg-status-warn/10 text-status-warn border border-status-warn/20";
      case "RUIM":
        return "bg-status-bad/10 text-status-bad border border-status-bad/20";
      default:
        return "bg-slate-100 text-slate-400 border border-slate-200";
    }
  };

  const getStatusLabel = (status: LocalItem["status"]) => {
    switch (status) {
      case "BOM":
        return "Bom Estado";
      case "REGULAR":
        return "Atenção / Regular";
      case "RUIM":
        return "Avariado / Danificado";
      default:
        return "Não vistoriado";
    }
  };

  const doneitems = items.filter(i => i.status !== "PENDENTE").length;
  const pctAmbiente = items.length > 0 ? Math.round((doneitems / items.length) * 100) : 0;

  return (
    <PhoneShell showNav={false}>
      <TopBar title={ambiente.nome} backTo={`/field/vistorias/${id}/ambientes`} />

      <main className="flex-1 px-5 pt-2 pb-32 space-y-5">
        {/* Environment Progress Header */}
        {items.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso do Cômodo</p>
                <p className="text-xl font-bold text-secondary">{pctAmbiente}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-secondary">{doneitems}/{items.length}</p>
                <p className="text-[10px] text-slate-400">itens vistoriados</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pctAmbiente}%` }}
              />
            </div>
          </div>
        )}

        {/* Header Row */}
        <div className="flex justify-between items-center select-none">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Itens do Cômodo</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {items.length > 0 ? `${items.length} itens a vistoriar` : "Nenhum item cadastrado"}
            </p>
          </div>
          <button
            onClick={() => setShowAddItem(true)}
            className="text-xs bg-[#00AEEF] hover:bg-[#009ACD] text-white px-4 py-2 rounded-full font-bold shadow-sm transition-colors flex items-center gap-1"
          >
            <Icon name="add" className="text-[14px]" />
            Adicionar Item
          </button>
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center">
              <Icon name="inventory_2" className="text-[36px] text-primary/40" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-secondary">Nenhum item cadastrado</h3>
              <p className="text-xs text-slate-400 max-w-[220px]">
                O admin não cadastrou itens para este cômodo, ou você pode adicionar itens manualmente.
              </p>
            </div>
            <button
              onClick={() => setShowAddItem(true)}
              className="h-12 px-6 rounded-full bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 flex items-center gap-2 hover:bg-[#009acd] transition-all"
            >
              <Icon name="add_circle" className="text-[18px]" />
              Adicionar Primeiro Item
            </button>
          </div>
        )}

        {/* Items List */}
        {items.length > 0 && (
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const { photos, audios } = getItemMediaStats(item.id);
              const isDone = item.status !== "PENDENTE";

              return (
                <li key={item.id}>
                  <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-secondary leading-snug">{item.nome}</h4>
                        {item.descricao && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                            &ldquo;{item.descricao}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1">
                      {/* Media counts indicator */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold select-none">
                        <span className="flex items-center gap-1">
                          <Icon name="image" className={photos > 0 ? "text-primary" : "text-slate-300"} />
                          {photos} {photos === 1 ? "foto" : "fotos"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="graphic_eq" className={audios > 0 ? "text-primary" : "text-slate-300"} />
                          {audios} {audios === 1 ? "áudio" : "áudios"}
                        </span>
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${item.id}`}
                          className="text-xs bg-primary hover:bg-[#009acd] text-white px-3.5 py-1.5 rounded-full font-bold shadow-sm flex items-center gap-1 transition-colors"
                        >
                          <Icon name="photo_camera" className="text-[14px]" />
                          {isDone ? "Rever" : "Capturar"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Success complete banner */}
        {items.length > 0 && items.every(i => i.status !== "PENDENTE") && (
          <div className="bg-status-good/10 border border-status-good/20 text-status-good p-4 rounded-3xl text-center flex flex-col items-center gap-2 select-none">
            <Icon name="check_circle" filled className="text-[26px]" />
            <span className="text-xs font-bold">Todo este cômodo foi vistoriado com sucesso!</span>
          </div>
        )}
      </main>

      {/* Floating Add Item Button (always visible) */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-background-light via-background-light to-transparent md:max-w-md md:mx-auto z-20">
        <button
          onClick={() => setShowAddItem(true)}
          className="w-full h-14 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:bg-[#009acd] transition-all active:scale-[0.98]"
        >
          <Icon name="add_circle" className="text-[20px]" />
          Adicionar Item Personalizado
        </button>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl" style={{ maxWidth: "448px" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-secondary">Adicionar Item</h3>
              <button
                type="button"
                onClick={() => { setShowAddItem(false); setNewItemName(""); setNewItemDescricao(""); }}
                className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <Icon name="close" className="text-[20px] text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Nome do Item <span className="text-status-bad">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Porta de entrada, Janela, Tomada..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder-slate-300"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Descrição inicial (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Verificar estado da pintura..."
                  value={newItemDescricao}
                  onChange={e => setNewItemDescricao(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddItem(false); setNewItemName(""); setNewItemDescricao(""); }}
                  className="flex-1 py-3.5 border border-slate-200 text-secondary font-bold rounded-full text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newItemName.trim() || addingItem}
                  className="flex-1 py-3.5 bg-primary text-white font-bold rounded-full text-sm shadow-sm hover:bg-[#009acd] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingItem ? (
                    <Icon name="progress_activity" className="text-[18px] animate-spin" />
                  ) : (
                    <>
                      <Icon name="add" className="text-[18px]" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
