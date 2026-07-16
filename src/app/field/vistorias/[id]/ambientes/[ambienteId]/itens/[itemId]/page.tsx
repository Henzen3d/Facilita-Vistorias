"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { useCamera } from "@/hooks/useCamera";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { getDB, LocalItem, LocalAmbiente, LocalMidia } from "@/lib/db/idb";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string; itemId: string }>;
}

export default function FieldItemCapture({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id, ambienteId, itemId } = resolvedParams;
  const router = useRouter();

  const [item, setItem] = useState<LocalItem | null>(null);
  const [ambiente, setAmbiente] = useState<LocalAmbiente | null>(null);
  const [loading, setLoading] = useState(true);

  // Inputs
  const [status, setStatus] = useState<LocalItem["status"]>("PENDENTE");
  const [descricao, setDescricao] = useState("");

  // Media state
  const [midiasItem, setMidiasItem] = useState<LocalMidia[]>([]);

  // Camera hook
  const { capturePhoto, loading: cameraLoading } = useCamera();
  
  // Audio hook
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error: _audioError,
    startRecording,
    stopRecording,
    clearAudio,
  } = useAudioRecorder();

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        const itemData = await db.get("items", itemId);
        if (itemData) {
          setItem(itemData);
          setStatus(itemData.status !== "PENDENTE" ? itemData.status : "BOM");
          setDescricao(itemData.descricao || "");
        }
        const ambData = await db.get("ambientes", ambienteId);
        if (ambData) {
          setAmbiente(ambData);
        }

        // Carrega mídias gravadas para este item
        const allMidias = await db.getAll("midias");
        const filteredMidias = allMidias.filter(m => m.itemId === itemId);
        setMidiasItem(filteredMidias);
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

  // Handle Photo Capture (Natively opens device camera)
  const handlePhotoCapture = async () => {
    try {
      const captured = await capturePhoto();
      const db = await getDB();
      if (db) {
        const midiaId = `mid-f-${Date.now()}`;
        const newMidia = {
          id: midiaId,
          tipo: "FOTO" as const,
          url: captured.blobUrl,
          key: `${itemId}/${midiaId}.jpg`,
          itemId: itemId,
          uploadedAt: new Date().toISOString(),
          syncStatus: "PENDENTE" as const,
          blob: captured.file,
        };
        await db.put("midias", newMidia);
        
        // Add to queue
        await db.put("mutation_queue", {
          action: "CREATE_MIDIA",
          vistoriaId: id,
          payload: { id: midiaId, tipo: "FOTO", key: newMidia.key, itemId },
          timestamp: Date.now()
        });

        // Atualiza estado local
        const updated = await db.getAll("midias");
        setMidiasItem(updated.filter(m => m.itemId === itemId));
      }
    } catch (err) {
      console.log("Fluxo de foto cancelado ou falhou:", err);
    }
  };

  // Handle Gallery Selection (Alternative/fallback)
  const handleGalleryCapture = async () => {
    try {
      const db = await getDB();
      if (!db) return;

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
          try {
            const blobUrl = URL.createObjectURL(file);
            const midiaId = `mid-f-${Date.now()}`;
            const newMidia = {
              id: midiaId,
              tipo: "FOTO" as const,
              url: blobUrl,
              key: `${itemId}/${midiaId}.jpg`,
              itemId: itemId,
              uploadedAt: new Date().toISOString(),
              syncStatus: "PENDENTE" as const,
              blob: file,
            };
            await db.put("midias", newMidia);
            
            // Add to queue
            await db.put("mutation_queue", {
              action: "CREATE_MIDIA",
              vistoriaId: id,
              payload: { id: midiaId, tipo: "FOTO", key: newMidia.key, itemId },
              timestamp: Date.now()
            });

            // Atualiza estado local
            const updated = await db.getAll("midias");
            setMidiasItem(updated.filter(m => m.itemId === itemId));
          } catch (err) {
            console.error("Falha ao processar arquivo selecionado:", err);
          }
        }
      };
      input.click();
    } catch (err) {
      console.error("Erro ao selecionar da galeria:", err);
    }
  };

  // Handle Delete Media
  const handleDeleteMidia = async (midiaId: string) => {
    try {
      const db = await getDB();
      if (db) {
        await db.delete("midias", midiaId);

        // Queue deletion in sync queue
        await db.put("mutation_queue", {
          action: "DELETE_MIDIA",
          vistoriaId: id,
          payload: { id: midiaId, itemId },
          timestamp: Date.now()
        });

        // Atualiza estado local
        setMidiasItem(prev => prev.filter(m => m.id !== midiaId));
      }
    } catch (err) {
      console.error("Erro ao deletar mídia do IDB:", err);
    }
  };

  // Handle Audio Stop and Save
  const handleSaveAudio = async () => {
    if (!audioBlob) return;

    try {
      const db = await getDB();
      if (db) {
        const midiaId = `mid-a-${Date.now()}`;
        const newMidia = {
          id: midiaId,
          tipo: "AUDIO" as const,
          url: audioUrl || "",
          key: `${itemId}/${midiaId}.webm`,
          itemId: itemId,
          uploadedAt: new Date().toISOString(),
          syncStatus: "PENDENTE" as const,
          blob: audioBlob,
        };
        await db.put("midias", newMidia);

        // Add to queue
        await db.put("mutation_queue", {
          action: "CREATE_MIDIA",
          vistoriaId: id,
          payload: { id: midiaId, tipo: "AUDIO", key: newMidia.key, itemId },
          timestamp: Date.now()
        });
        
        // Atualiza estado local
        const updated = await db.getAll("midias");
        setMidiasItem(updated.filter(m => m.itemId === itemId));

        clearAudio();
      }
    } catch (err) {
      console.error("Erro ao salvar áudio no IDB:", err);
    }
  };

  // Auto save audio when it becomes available
  useEffect(() => {
    if (audioBlob) {
      handleSaveAudio();
    }
  }, [audioBlob]);

  // Handle finalize and save status/description
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
        
        // Add item update to mutation queue
        await db.put("mutation_queue", {
          action: "UPDATE_ITEM_STATUS",
          vistoriaId: id,
          payload: { id: itemId, status, descricao: updatedItem.descricao },
          timestamp: Date.now()
        });

        // Navigate back to environment page
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

  const fotos = midiasItem.filter(m => m.tipo === "FOTO");
  const audios = midiasItem.filter(m => m.tipo === "AUDIO");
  
  // Waveform heights for simulation
  const waveformHeights = [8, 18, 28, 14, 24, 34, 20, 30, 16, 26, 36, 22, 14, 28, 20, 32, 16, 24, 30, 18, 26];

  return (
    <PhoneShell showNav={false}>
      <TopBar title="Vistoriar Item" backTo={`/field/vistorias/${id}/ambientes/${ambienteId}`} />

      <main className="flex-1 px-5 pt-2 pb-32 space-y-6">
        
        {/* Item Header */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Ambiente: {ambiente.nome}</span>
            <h2 className="text-base font-bold text-secondary">{item.nome}</h2>
          </div>
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Icon name="inventory_2" className="text-[20px]" />
          </div>
        </div>

        {/* Section 1: Photo Proof */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
              <Icon name="photo_camera" className="text-[16px] text-primary" />
              Evidências Fotográficas ({fotos.length})
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGalleryCapture}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Icon name="photo_library" className="text-[14px]" />
                Galeria
              </button>
            </div>
          </div>

          {/* Grid of photos */}
          <div className="grid grid-cols-2 gap-3">
            {fotos.map((foto, index) => (
              <div key={foto.id} className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm group">
                <img src={foto.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                
                {/* Meta time indicator */}
                <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur px-2 py-0.5 rounded-full text-[9px] text-white flex items-center gap-1">
                  <Icon name="schedule" className="text-[10px]" />
                  Foto {index + 1}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeleteMidia(foto.id)}
                  className="absolute top-2 right-2 h-7 w-7 bg-status-bad text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
                >
                  <Icon name="close" className="text-[16px]" />
                </button>
              </div>
            ))}

            {/* Add Photo Button (Trigger native camera selection) */}
            <button
              type="button"
              onClick={handlePhotoCapture}
              disabled={cameraLoading}
              className="relative aspect-[4/3] rounded-3xl border-2 border-primary/20 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-primary gap-1 cursor-pointer"
            >
              {cameraLoading ? (
                <Icon name="progress_activity" className="text-[28px] animate-spin" />
              ) : (
                <>
                  <Icon name="add_a_photo" className="text-[28px]" />
                  <span className="text-[11px] font-bold">Tirar Foto</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Section 2: Audio observations */}
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <Icon name="graphic_eq" className="text-[16px] text-primary" />
            Observações em Áudio ({audios.length})
          </h3>

          <div className="space-y-2">
            {/* Audio waveform recording block */}
            {isRecording && (
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-status-bad text-white flex items-center justify-center">
                  <Icon name="mic" filled className="text-[16px]" />
                </div>
                <div className="flex-1 flex items-end gap-[2px] h-8 pb-1 overflow-hidden">
                  {waveformHeights.map((h, i) => {
                    const animatedHeight = Math.max(4, h + Math.sin(recordingTime * 3 + i) * 6);
                    return (
                      <span
                        key={i}
                        className="w-[2.5px] rounded-full bg-primary"
                        style={{ height: `${animatedHeight}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-secondary tabular-nums">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}

            {/* List of saved audios */}
            {audios.map((audio, index) => (
              <div key={audio.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="volume_up" className="text-[18px]" />
                  </span>
                  <div className="text-left">
                    <span className="text-xs font-bold text-secondary block">Áudio {index + 1}</span>
                    <span className="text-[10px] text-slate-400">Gravado localmente</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <audio src={audio.url} className="hidden" id={`audio-player-${audio.id}`} controls />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`audio-player-${audio.id}`) as HTMLAudioElement;
                      if (el) el.play();
                    }}
                    className="h-8 w-8 rounded-full bg-white border border-slate-100 text-primary flex items-center justify-center hover:bg-slate-50 shadow-sm active:scale-95"
                  >
                    <Icon name="play_arrow" className="text-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMidia(audio.id)}
                    className="h-8 w-8 rounded-full bg-white border border-slate-100 text-status-bad flex items-center justify-center hover:bg-red-50 shadow-sm active:scale-95"
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>
                </div>
              </div>
            ))}

            {/* Audio trigger button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full h-12 rounded-2xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isRecording
                  ? "bg-status-bad border-status-bad text-white"
                  : "bg-white border-slate-200 text-secondary hover:bg-slate-50"
              }`}
            >
              <Icon name="mic" filled={isRecording} className="text-[18px]" />
              {isRecording ? "Parar Gravação" : "Gravar Anotação por Voz"}
            </button>
          </div>
        </section>

        {/* Section 3: Condition Rating */}
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <Icon name="stars" className="text-[16px] text-primary" />
            Avaliação do Estado
          </h3>
          
          <div className="grid grid-cols-3 gap-2.5">
            {/* Bom (Good) */}
            <button
              type="button"
              onClick={() => setStatus("BOM")}
              className={`py-3.5 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                status === "BOM"
                  ? "bg-status-good/8 border-status-good text-status-good"
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              }`}
            >
              <Icon name="check_circle" filled={status === "BOM"} className={status === "BOM" ? "text-status-good" : "text-slate-300"} />
              Bom Estado
            </button>

            {/* Regular */}
            <button
              type="button"
              onClick={() => setStatus("REGULAR")}
              className={`py-3.5 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                status === "REGULAR"
                  ? "bg-status-warn/8 border-status-warn text-status-warn"
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              }`}
            >
              <Icon name="remove_circle" filled={status === "REGULAR"} className={status === "REGULAR" ? "text-status-warn" : "text-slate-300"} />
              Regular
            </button>

            {/* Ruim (Bad) */}
            <button
              type="button"
              onClick={() => setStatus("RUIM")}
              className={`py-3.5 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                status === "RUIM"
                  ? "bg-status-bad/8 border-status-bad text-status-bad"
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              }`}
            >
              <Icon name="cancel" filled={status === "RUIM"} className={status === "RUIM" ? "text-status-bad" : "text-slate-300"} />
              Avariado
            </button>
          </div>
        </section>

        {/* Section 4: Observation Notes */}
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <Icon name="rate_review" className="text-[16px] text-primary" />
            Anotações Adicionais
          </h3>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Digite aqui observações detalhadas sobre o estado ou avarias encontradas neste item..."
            rows={4}
            className="w-full text-sm p-4 rounded-3xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-secondary placeholder-slate-400 bg-white shadow-sm leading-relaxed"
          />
        </section>

      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-background-light via-background-light to-transparent md:max-w-md md:mx-auto z-20">
        <button
          type="button"
          onClick={handleSaveItem}
          className="w-full h-16 rounded-full bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:bg-[#009acd] transition-all active:scale-[0.98]"
        >
          <Icon name="save" className="text-[22px]" />
          Salvar Avaliação do Item
        </button>
      </div>
    </PhoneShell>
  );
}
