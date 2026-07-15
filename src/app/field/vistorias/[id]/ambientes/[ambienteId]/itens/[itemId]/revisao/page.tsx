"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { getDB, LocalItem, LocalAmbiente, LocalMidia } from "@/lib/db/idb";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string; itemId: string }>;
}

export default function FieldItemReview({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id, ambienteId, itemId } = resolvedParams;
  const router = useRouter();

  const [item, setItem] = useState<LocalItem | null>(null);
  const [ambiente, setAmbiente] = useState<LocalAmbiente | null>(null);
  const [midias, setMidias] = useState<LocalMidia[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // States
  const [status, setStatus] = useState<LocalItem["status"]>("PENDENTE");
  const [descricao, setDescricao] = useState("");

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        // Load item
        const itemData = await db.get("items", itemId);
        if (itemData) {
          setItem(itemData);
          setStatus(itemData.status !== "PENDENTE" ? itemData.status : "BOM");
          setDescricao(itemData.descricao || "");
        }

        // Load environment
        const ambData = await db.get("ambientes", ambienteId);
        if (ambData) {
          setAmbiente(ambData);
        }

        // Load item media
        const allMidias = await db.getAll("midias");
        const itemMidias = allMidias.filter(m => m.itemId === itemId);
        setMidias(itemMidias);
      }
    } catch (err) {
      console.error("Erro ao carregar dados no IDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itemId]);

  const handleDeleteActivePhoto = async () => {
    const photos = midias.filter(m => m.tipo === "FOTO");
    if (photos.length === 0) return;

    const targetPhoto = photos[activePhotoIdx];
    try {
      const db = await getDB();
      if (db) {
        // Remove from IndexedDB
        await db.delete("midias", targetPhoto.id);
        
        // Add delete to mutation queue
        await db.put("mutation_queue", {
          action: "DELETE_MIDIA",
          vistoriaId: id,
          payload: { id: targetPhoto.id, key: targetPhoto.key },
          timestamp: Date.now()
        });

        // Revoke blob URL
        if (targetPhoto.url.startsWith("blob:")) {
          URL.revokeObjectURL(targetPhoto.url);
        }

        // Reload data
        loadData();
        setActivePhotoIdx(Math.max(0, activePhotoIdx - 1));
      }
    } catch (err) {
      console.error("Erro ao excluir foto:", err);
    }
  };

  const handleSaveItem = async () => {
    if (!item) return;

    const updatedItem = {
      ...item,
      status,
      descricao: descricao.trim() || null,
      updatedAt: new Date().toISOString()
    };

    try {
      const db = await getDB();
      if (db) {
        await db.put("items", updatedItem);

        // Queue item update
        await db.put("mutation_queue", {
          action: "UPDATE_ITEM_STATUS",
          vistoriaId: id,
          payload: { id: itemId, status, descricao: updatedItem.descricao },
          timestamp: Date.now()
        });

        // Redirect back to environment
        router.push(`/field/vistorias/${id}/ambientes/${ambienteId}`);
      }
    } catch (err) {
      console.error("Erro ao salvar item:", err);
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

  if (!item || !ambiente) {
    return (
      <PhoneShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">Dados do item ou cômodo não encontrados.</p>
        </div>
      </PhoneShell>
    );
  }

  const photos = midias.filter(m => m.tipo === "FOTO");
  const audios = midias.filter(m => m.tipo === "AUDIO");
  const activePhoto = photos[activePhotoIdx];

  return (
    <PhoneShell showNav={false}>
      <TopBar
        title="Revisar Item"
        backTo={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${itemId}`}
        right={
          photos.length > 0 ? (
            <button
              onClick={handleDeleteActivePhoto}
              aria-label="Excluir foto ativa"
              className="h-11 w-11 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <Icon name="delete_outline" className="text-[22px] text-status-bad" />
            </button>
          ) : undefined
        }
      />

      {/* Main content */}
      <div className="px-5">
        {/* Photo Viewfinder Preview */}
        {photos.length > 0 ? (
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-secondary shadow-md border border-slate-200">
            <img
              src={activePhoto.url}
              alt="Foto do item"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-black/50 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider select-none">
              <Icon name="photo_camera" className="text-[14px]" />
              Foto {activePhotoIdx + 1} de {photos.length}
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-black/50 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider select-none">
              <Icon name="place" className="text-[14px] text-brand-accent" />
              {ambiente.nome}
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] rounded-3xl bg-slate-100 border border-slate-200 border-dashed flex flex-col items-center justify-center gap-2 select-none">
            <Icon name="image" className="text-3xl text-slate-300" />
            <p className="text-xs text-slate-400">Nenhuma foto capturada.</p>
          </div>
        )}

        {/* Thumbnail Selector */}
        {photos.length > 0 && (
          <div className="mt-4 flex items-center gap-2 select-none overflow-x-auto pb-1">
            {photos.map((ph, idx) => (
              <button
                key={ph.id}
                onClick={() => setActivePhotoIdx(idx)}
                className={`h-14 w-14 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                  idx === activePhotoIdx
                    ? "border-primary ring-2 ring-primary/20 scale-95"
                    : "border-slate-200 opacity-60"
                }`}
              >
                <img src={ph.url} className="h-full w-full object-cover" alt="" />
              </button>
            ))}
            
            <Link
              href={`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${itemId}`}
              className="h-14 w-14 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-primary transition-colors shrink-0"
            >
              <Icon name="add" className="text-[22px]" />
            </Link>
          </div>
        )}
      </div>

      {/* Audio player card if audio exists */}
      {audios.length > 0 && (
        <section className="px-5 mt-5 select-none">
          <div className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Icon name="mic" className="text-[20px]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gravação de Voz</p>
              <audio src={audios[0].url} controls className="w-full mt-1.5 h-8 text-xs bg-slate-50 rounded" />
            </div>
            <button
              onClick={async () => {
                const db = await getDB();
                if (db) {
                  await db.delete("midias", audios[0].id);
                  await db.put("mutation_queue", {
                    action: "DELETE_MIDIA",
                    vistoriaId: id,
                    payload: { id: audios[0].id, key: audios[0].key },
                    timestamp: Date.now()
                  });
                  loadData();
                }
              }}
              title="Excluir áudio"
              className="h-9 w-9 rounded-full bg-slate-50 text-status-bad flex items-center justify-center border border-slate-100 hover:bg-slate-100 transition-colors"
            >
              <Icon name="delete" className="text-[18px]" />
            </button>
          </div>
        </section>
      )}

      {/* Suggested text area card */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-2 select-none">
          <div className="flex items-center gap-2">
            <Icon name="auto_awesome" className="text-brand-accent text-[18px]" />
            <h2 className="text-xs font-bold text-secondary">Anotações do Item</h2>
          </div>
        </div>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          placeholder="Descreva as condições deste item (ex: desgaste, arranhões, etc.)"
          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-[14px] leading-relaxed text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm placeholder-slate-400"
        />
        <p className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1 select-none">
          <Icon name="info" className="text-[14px]" />
          Revise e edite a descrição antes de confirmar para o laudo final.
        </p>
      </div>

      {/* Item condition segmented controls */}
      <div className="px-5 mt-6 select-none">
        <h2 className="text-xs font-bold text-secondary mb-2">Avaliação do Estado</h2>
        <div className="p-1 rounded-2xl bg-slate-100 flex gap-1 border border-slate-200/50">
          <SegBtn
            label="Bom"
            icon="check_circle"
            tone="good"
            active={status === "BOM"}
            onClick={() => setStatus("BOM")}
          />
          <SegBtn
            label="Regular"
            icon="warning"
            tone="warn"
            active={status === "REGULAR"}
            onClick={() => setStatus("REGULAR")}
          />
          <SegBtn
            label="Ruim"
            icon="error"
            tone="bad"
            active={status === "RUIM"}
            onClick={() => setStatus("RUIM")}
          />
        </div>
      </div>

      {/* Action CTA Row */}
      <div className="px-5 mt-8 pb-8 flex gap-3 select-none">
        <button
          onClick={() => router.push(`/field/vistorias/${id}/ambientes/${ambienteId}/itens/${itemId}`)}
          className="h-14 flex-1 rounded-full border border-slate-200 bg-white text-secondary font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors"
        >
          Refazer Captura
        </button>
        <button
          onClick={handleSaveItem}
          className="h-14 flex-[1.4] rounded-full bg-primary hover:bg-[#009acd] text-white font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-1 transition-all"
        >
          Confirmar e Salvar
          <Icon name="check" className="text-[22px]" />
        </button>
      </div>
    </PhoneShell>
  );
}

interface SegBtnProps {
  label: string;
  icon: string;
  tone: "good" | "warn" | "bad";
  active: boolean;
  onClick: () => void;
}

function SegBtn({ label, icon, tone, active, onClick }: SegBtnProps) {
  const toneBg =
    tone === "good" ? "bg-status-good" : tone === "warn" ? "bg-status-warn" : "bg-status-bad";
  const toneText =
    tone === "good" ? "text-status-good" : tone === "warn" ? "text-status-warn" : "text-status-bad";

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      type="button"
      className={`flex-1 min-h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold uppercase tracking-wide transition-all ${
        active ? `${toneBg} text-white shadow-sm scale-95` : `bg-transparent ${toneText}`
      }`}
    >
      <Icon name={icon} filled={active} className="text-[18px]" />
      {label}
    </button>
  );
}
