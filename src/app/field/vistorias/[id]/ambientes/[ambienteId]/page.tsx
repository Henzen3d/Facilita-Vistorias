"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { getDB, LocalAmbiente, LocalItem, LocalMidia } from "@/lib/db/idb";

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

  return (
    <PhoneShell showNav={false}>
      <TopBar title={ambiente.nome} backTo={`/field/vistorias/${id}/ambientes`} />

      <main className="flex-1 px-5 pt-2 pb-6 space-y-6">
        {/* Environment Title Card */}
        <div className="flex justify-between items-center select-none">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Itens do Cômodo</h2>
            <p className="text-xs text-slate-400 mt-0.5">{items.length} itens a vistoriar no total</p>
          </div>
          <Link
            href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/novo`}
            className="text-xs bg-[#00AEEF] hover:bg-[#009ACD] text-white px-4 py-1.5 rounded-full font-bold shadow-sm transition-colors"
          >
            + Item Custom
          </Link>
        </div>

        {/* Items List */}
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
                        Capturar
                      </Link>
                      
                      {isDone && (
                        <Link
                          href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${item.id}/revisao`}
                          className="text-xs text-primary bg-primary/5 border border-primary/20 px-3.5 py-1.5 rounded-full font-bold hover:bg-primary/10 transition-colors"
                        >
                          Rever
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Success complete banner */}
        {items.length > 0 && items.every(i => i.status !== "PENDENTE") && (
          <div className="bg-status-good/10 border border-status-good/20 text-status-good p-4 rounded-3xl text-center flex flex-col items-center gap-2 select-none">
            <Icon name="check_circle" filled className="text-[26px]" />
            <span className="text-xs font-bold">Todo este cômodo foi vistoriado com sucesso!</span>
          </div>
        )}
      </main>
    </PhoneShell>
  );
}
