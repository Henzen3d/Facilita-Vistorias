"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDB, LocalAmbiente, LocalItem, LocalMidia } from "@/lib/db/idb";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string }>;
}

export default function FieldAmbienteDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id, ambienteId } = resolvedParams;

  const [ambiente, setAmbiente] = useState<LocalAmbiente | null>(null);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [midias, setMidias] = useState<LocalMidia[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescricao, setNewItemDescricao] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        const amb = await db.get("ambientes", ambienteId);
        if (amb) {
          setAmbiente(amb);
        }

        const allItems = await db.getAll("items");
        const filteredItems = allItems.filter((i) => i.ambienteId === ambienteId);
        setItems(filteredItems);

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

        await db.put("mutation_queue", {
          action: "CREATE_ITEM_LOCAL",
          vistoriaId: id,
          payload: { item: novoItem },
          timestamp: Date.now(),
        });

        setItems((prev) => [...prev, novoItem]);
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
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="h-16 w-16 bg-red-50 text-status-bad rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="error" className="text-[32px]" />
            </div>
            <h3 className="text-base font-bold text-secondary">Ambiente não localizado</h3>
            <Link
              href={`/field/vistorias/${id}/ambientes`}
              className="inline-flex items-center justify-center mt-4 min-h-[44px] text-sm font-bold text-primary hover:underline"
            >
              Voltar aos cômodos
            </Link>
          </div>
        </div>
      </PhoneShell>
    );
  }

  const getItemMediaStats = (itemId: string) => {
    const itemMidias = midias.filter((m) => m.itemId === itemId);
    const photos = itemMidias.filter((m) => m.tipo === "FOTO").length;
    const audios = itemMidias.filter((m) => m.tipo === "AUDIO").length;
    return { photos, audios };
  };

  const getStatusTone = (
    status: LocalItem["status"],
  ): "good" | "fair" | "bad" | "pending" => {
    switch (status) {
      case "BOM":
        return "good";
      case "REGULAR":
        return "fair";
      case "RUIM":
        return "bad";
      default:
        return "pending";
    }
  };

  const getStatusLabel = (status: LocalItem["status"]) => {
    switch (status) {
      case "BOM":
        return "Bom estado";
      case "REGULAR":
        return "Regular";
      case "RUIM":
        return "Avariado";
      default:
        return "Pendente";
    }
  };

  const doneItems = items.filter((i) => i.status !== "PENDENTE").length;
  const pctAmbiente = items.length > 0 ? Math.round((doneItems / items.length) * 100) : 0;
  const allDone = items.length > 0 && items.every((i) => i.status !== "PENDENTE");
  const nextPending = items.find((i) => i.status === "PENDENTE");

  return (
    <PhoneShell showNav={false}>
      <TopBar title={ambiente.nome} backTo={`/field/vistorias/${id}/ambientes`} />

      <main className="flex-1 px-5 pt-2 pb-36 space-y-5">
        {/* Environment progress */}
        <div className="bg-secondary text-white rounded-3xl p-4 shadow-lg shadow-secondary/15 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Progresso do cômodo
              </p>
              <p className="text-2xl font-bold tabular-nums mt-0.5">{pctAmbiente}%</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold tabular-nums">
                {doneItems}/{items.length}
              </p>
              <p className="text-xs text-white/60">itens vistoriados</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                allDone ? "bg-status-good" : "bg-primary",
              )}
              style={{ width: `${pctAmbiente}%` }}
            />
          </div>
        </div>

        {nextPending && (
          <Link
            href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${nextPending.id}`}
            className="flex items-center gap-3 w-full min-h-[52px] rounded-full bg-primary hover:bg-primary-hover text-white px-5 py-3 shadow-soft transition-all active:scale-[0.98]"
          >
            <Icon name="photo_camera" className="text-[22px] shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold">Continuar vistoria</p>
              <p className="text-xs text-white/85 truncate">{nextPending.nome}</p>
            </div>
            <Icon name="chevron_right" className="text-[20px] shrink-0" />
          </Link>
        )}

        <div className="flex justify-between items-center gap-3 select-none">
          <div>
            <h2 className="text-sm font-bold text-secondary">Itens do cômodo</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {items.length > 0
                ? `${items.length} item${items.length > 1 ? "s" : ""}`
                : "Nenhum item cadastrado"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sm transition-colors"
          >
            <Icon name="add" className="text-[16px]" />
            Item
          </button>
        </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-white border border-slate-100 rounded-3xl shadow-sm px-6">
            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center">
              <Icon name="inventory_2" className="text-[36px] text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-secondary">Nenhum item cadastrado</h3>
              <p className="text-sm text-slate-500 max-w-[28ch] mx-auto">
                Adicione itens deste cômodo para capturar foto e áudio na vistoria.
              </p>
            </div>
            <Button onClick={() => setShowAddItem(true)} size="lg">
              <Icon name="add_circle" className="text-[20px]" />
              Adicionar primeiro item
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <ul className="flex flex-col gap-3">
            {items.map((item, index) => {
              const { photos, audios } = getItemMediaStats(item.id);
              const isDone = item.status !== "PENDENTE";
              const tone = getStatusTone(item.status);

              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      "bg-white border border-slate-100 rounded-3xl p-4 flex flex-col gap-3 shadow-sm border-l-4",
                      isDone
                        ? tone === "good"
                          ? "border-l-status-good"
                          : tone === "fair"
                            ? "border-l-status-warn"
                            : "border-l-status-bad"
                        : "border-l-slate-200",
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h4 className="font-bold text-sm text-secondary leading-snug">
                            {item.nome}
                          </h4>
                        </div>
                        {item.descricao && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {item.descricao}
                          </p>
                        )}
                      </div>
                      <Badge tone={tone}>{getStatusLabel(item.status)}</Badge>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 gap-2">
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold select-none">
                        <span className="inline-flex items-center gap-1 min-h-[32px]">
                          <Icon
                            name="image"
                            className={photos > 0 ? "text-primary" : "text-slate-300"}
                          />
                          {photos}
                        </span>
                        <span className="inline-flex items-center gap-1 min-h-[32px]">
                          <Icon
                            name="graphic_eq"
                            className={audios > 0 ? "text-primary" : "text-slate-300"}
                          />
                          {audios}
                        </span>
                      </div>

                      <Link
                        href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${item.id}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full text-sm font-bold shadow-sm transition-colors",
                          isDone
                            ? "bg-secondary text-white hover:bg-secondary/90"
                            : "bg-primary hover:bg-primary-hover text-white",
                        )}
                      >
                        <Icon
                          name={isDone ? "visibility" : "photo_camera"}
                          className="text-[16px]"
                        />
                        {isDone ? "Rever" : "Capturar"}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {allDone && (
          <div className="bg-green-50 border border-status-good/20 text-status-good p-4 rounded-3xl text-center flex flex-col items-center gap-2 select-none">
            <Icon name="check_circle" filled className="text-[28px]" />
            <span className="text-sm font-bold">
              Todo este cômodo foi vistoriado com sucesso
            </span>
            <Link
              href={`/field/vistorias/${id}/ambientes`}
              className="text-sm font-bold underline underline-offset-2 min-h-[44px] inline-flex items-center"
            >
              Voltar à lista de cômodos
            </Link>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-background-light via-background-light to-transparent md:max-w-md md:mx-auto z-20">
        <Button onClick={() => setShowAddItem(true)} fullWidth size="lg" className="shadow-lg shadow-primary/25">
          <Icon name="add_circle" className="text-[22px]" />
          Adicionar item personalizado
        </Button>
      </div>

      {showAddItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div
            className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl"
            style={{ maxWidth: "448px" }}
            role="dialog"
            aria-labelledby="add-item-title"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="add-item-title" className="text-base font-bold text-secondary">
                Adicionar item
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddItem(false);
                  setNewItemName("");
                  setNewItemDescricao("");
                }}
                aria-label="Fechar"
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <Icon name="close" className="text-[20px] text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-item-name"
                  className="text-xs uppercase tracking-wider font-bold text-slate-400"
                >
                  Nome do item <span className="text-status-bad">*</span>
                </label>
                <input
                  id="new-item-name"
                  type="text"
                  placeholder="Ex: Porta de entrada, janela, tomada…"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder:text-slate-300"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-item-desc"
                  className="text-xs uppercase tracking-wider font-bold text-slate-400"
                >
                  Descrição inicial (opcional)
                </label>
                <input
                  id="new-item-desc"
                  type="text"
                  placeholder="Ex: Verificar estado da pintura…"
                  value={newItemDescricao}
                  onChange={(e) => setNewItemDescricao(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder:text-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItemName("");
                    setNewItemDescricao("");
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" fullWidth disabled={!newItemName.trim() || addingItem}>
                  {addingItem ? (
                    <Icon name="progress_activity" className="text-[18px] animate-spin" />
                  ) : (
                    <>
                      <Icon name="add" className="text-[18px]" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
