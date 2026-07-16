"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneShell } from "@/components/app/PhoneShell";
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

  // Media hooks
  const { capturePhoto, loading: cameraLoading } = useCamera();
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

  // Handle Photo Capture
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

  // Handle Gallery Selection (Alternative if camera fails)
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

  // Waveform styling
  const waveformHeights = [10, 22, 32, 18, 28, 40, 24, 34, 20, 30, 42, 26, 18, 32, 24, 38, 20, 28, 34, 22, 30, 18, 26, 40, 24];

  const fotos = midiasItem.filter(m => m.tipo === "FOTO");
  const ultimaFoto = fotos[fotos.length - 1];

  return (
    <PhoneShell showNav={false} bg="dark">
      <div className="relative flex-1 flex flex-col text-white min-h-[700px]">
        {/* Background Viewfinder simulator / Última foto tirada */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: ultimaFoto ? `url(${ultimaFoto.url})` : "none",
            background: !ultimaFoto 
              ? "radial-gradient(120% 80% at 30% 20%, #2c3e52 0%, #16222f 55%, #0b1119 100%)" 
              : undefined,
          }}
        />

        {!ultimaFoto && (
          <svg viewBox="0 0 400 700" className="absolute inset-0 h-full w-full opacity-60 z-0 pointer-events-none select-none">
            <rect x="60" y="180" width="280" height="340" fill="#3a4a5c" />
            <rect x="90" y="220" width="100" height="130" fill="#5a6e83" />
            <rect x="220" y="220" width="100" height="130" fill="#5a6e83" />
            <rect x="90" y="380" width="230" height="120" fill="#455668" />
          </svg>
        )}

        {/* Top bar controls */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-3 select-none">
          <Link
            href={`/field/vistorias/${id}/ambientes/${ambienteId}`}
            aria-label="Fechar"
            className="h-11 w-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <Icon name="close" className="text-[24px]" />
          </Link>
          
          <div className="px-3.5 h-9 rounded-full bg-black/40 backdrop-blur flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className={`h-1.5 w-1.5 rounded-full bg-status-bad ${isRecording ? "animate-pulse" : ""}`} />
            {ambiente.nome}
          </div>
          
          <button className="h-11 w-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/50 transition-colors">
            <Icon name="flash_on" className="text-[22px] text-brand-accent" />
          </button>
        </div>

        {/* Framing Grid overlay */}
        <div className="relative z-10 mx-6 mt-6 mb-4 flex-1 rounded-3xl border-2 border-white/20 border-dashed relative select-none min-h-[220px]">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/5" />
            ))}
          </div>
          
          {/* Corner brackets */}
          <span className="absolute h-6 w-6 border-white/60 rounded-sm top-3 left-3 border-l-2 border-t-2" />
          <span className="absolute h-6 w-6 border-white/60 rounded-sm top-3 right-3 border-r-2 border-t-2" />
          <span className="absolute h-6 w-6 border-white/60 rounded-sm bottom-3 left-3 border-l-2 border-b-2" />
          <span className="absolute h-6 w-6 border-white/60 rounded-sm bottom-3 right-3 border-r-2 border-b-2" />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 h-8 rounded-full bg-black/50 backdrop-blur flex items-center gap-2 text-[10px] uppercase font-bold tracking-wide">
            <Icon name="photo_camera" className="text-primary text-[16px]" />
            {item.nome}
          </div>
        </div>

        {/* Dynamic Waveform Card (WhatsApp Style) */}
        {isRecording && (
          <div className="relative z-10 mx-5 mb-4 rounded-3xl bg-white border border-white/10 px-4 py-3 flex items-center gap-3 animate-slide-up shadow-lg">
            <div className="h-10 w-10 rounded-full bg-status-bad flex items-center justify-center animate-pulse">
              <Icon name="mic" filled className="text-white text-[20px]" />
            </div>
            <div className="flex-1 flex items-end gap-[3px] h-10 pb-1 overflow-hidden select-none">
              {waveformHeights.map((h, i) => {
                // Waveform animation simulation
                const randomOffset = Math.sin(recordingTime * 2 + i) * 10;
                const animatedHeight = Math.max(4, h + (isRecording ? randomOffset : 0));
                
                return (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-primary transition-all duration-150"
                    style={{ height: `${animatedHeight}px`, opacity: i > 15 ? 0.35 : 1 }}
                  />
                );
              })}
            </div>
            <div className="text-secondary font-bold text-sm tabular-nums select-none">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
            </div>
          </div>
        )}

        {/* Miniaturas de mídias tiradas */}
        {midiasItem.length > 0 && (
          <div className="relative z-10 mx-5 mb-3 p-3 bg-black/60 backdrop-blur border border-white/10 rounded-3xl space-y-2 select-none">
            <p className="text-[9px] uppercase tracking-wider font-bold text-white/50">Mídias do Item ({midiasItem.length})</p>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {midiasItem.map((midia) => (
                <div key={midia.id} className="relative shrink-0">
                  {midia.tipo === "FOTO" ? (
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/20">
                      <img src={midia.url} alt="Foto item" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeleteMidia(midia.id)}
                        className="absolute top-0.5 right-0.5 h-4 w-4 bg-status-bad text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <Icon name="close" className="text-[10px]" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative h-14 px-3 rounded-xl bg-primary/20 border border-primary/30 flex items-center gap-1.5 text-white">
                      <Icon name="graphic_eq" className="text-[16px] text-primary" />
                      <span className="text-[10px] font-bold">Áudio</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMidia(midia.id)}
                        className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 bg-status-bad text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm border border-black/10"
                      >
                        <Icon name="close" className="text-[10px]" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inputs panel (Description & Status) */}
        <div className="relative z-10 mx-5 mb-4 p-4 bg-white/95 backdrop-blur text-secondary rounded-3xl shadow-lg space-y-4">
          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anotações / Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva as condições deste item (ex: desgaste, arranhões, etc.)"
              rows={2}
              className="w-full text-xs p-2.5 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-secondary placeholder-slate-400"
            />
          </div>

          {/* Status selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avaliação do Estado</label>
            <div className="grid grid-cols-3 gap-2 select-none">
              <button
                type="button"
                onClick={() => setStatus("BOM")}
                className={`py-2 rounded-2xl text-xs font-bold border transition-colors ${
                  status === "BOM"
                    ? "bg-status-good text-white border-status-good"
                    : "bg-slate-50 border-slate-100 text-slate-500"
                }`}
              >
                Bom
              </button>
              <button
                type="button"
                onClick={() => setStatus("REGULAR")}
                className={`py-2 rounded-2xl text-xs font-bold border transition-colors ${
                  status === "REGULAR"
                    ? "bg-status-warn text-white border-status-warn"
                    : "bg-slate-50 border-slate-100 text-slate-500"
                }`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => setStatus("RUIM")}
                className={`py-2 rounded-2xl text-xs font-bold border transition-colors ${
                  status === "RUIM"
                    ? "bg-status-bad text-white border-status-bad"
                    : "bg-slate-50 border-slate-100 text-slate-500"
                }`}
              >
                Ruim
              </button>
            </div>
          </div>
        </div>

        {/* Floating actions & Shutter row */}
        <div className="relative z-10 pb-8 pt-2 select-none">
          {/* Microphone controls (simulate tap-hold / tap start) */}
          <div className="mx-5 mb-4 rounded-3xl bg-white/90 backdrop-blur px-3 py-3 flex items-center justify-around text-secondary shadow-md">
            <button 
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex flex-col items-center gap-1 min-w-[64px] min-h-[44px] ${isRecording ? "text-status-bad" : "text-secondary"}`}
            >
              <span className={`h-10 w-10 rounded-full flex items-center justify-center ${isRecording ? "bg-status-bad text-white animate-pulse" : "bg-slate-50 border border-slate-100 text-secondary"}`}>
                <Icon name="mic" filled={isRecording} className="text-[20px]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{isRecording ? "Parar" : "Gravar Áudio"}</span>
            </button>

            {/* Save Item Action */}
            <button
              type="button"
              onClick={handleSaveItem}
              className="flex flex-col items-center gap-1 min-w-[64px] min-h-[44px]"
            >
              <span className="h-10 w-10 rounded-full bg-status-good text-white flex items-center justify-center shadow hover:bg-emerald-600 transition-colors">
                <Icon name="save" className="text-[20px]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-status-good">Salvar</span>
            </button>
          </div>

          {/* Shutter camera trigger */}
          <div className="flex items-center justify-around px-8">
            <button 
              type="button"
              onClick={handleGalleryCapture}
              aria-label="Selecionar da Galeria" 
              className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
            >
              <Icon name="photo_library" className="text-[22px]" />
            </button>
            
            <button
              type="button"
              onClick={handlePhotoCapture}
              disabled={cameraLoading}
              aria-label="Capturar foto"
              className="h-20 w-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <Icon name="photo_camera" filled className="text-white text-[30px]" />
              </span>
            </button>
            
            <button aria-label="Virar câmera" className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Icon name="cameraswitch" className="text-[22px]" />
            </button>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
