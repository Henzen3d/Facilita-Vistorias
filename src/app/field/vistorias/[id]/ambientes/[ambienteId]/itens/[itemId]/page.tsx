"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { getDB, LocalItem, LocalAmbiente, LocalMidia } from "@/lib/db/idb";
import {
  buildItemPath,
  findNextPendingAfterSave,
} from "@/lib/field/itemNavigation";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string; ambienteId: string; itemId: string }>;
}

type Condition = "BOM" | "REGULAR" | "RUIM";

export default function FieldItemCapture({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id, ambienteId, itemId } = resolvedParams;
  const router = useRouter();

  const [item, setItem] = useState<LocalItem | null>(null);
  const [ambiente, setAmbiente] = useState<LocalAmbiente | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<LocalItem["status"]>("PENDENTE");
  const [descricao, setDescricao] = useState("");
  const [midiasItem, setMidiasItem] = useState<LocalMidia[]>([]);
  const [saving, setSaving] = useState(false);

  const { capturePhoto, loading: cameraLoading } = useCamera();

  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error: audioError,
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

        const allMidias = await db.getAll("midias");
        const filteredMidias = allMidias.filter((m) => m.itemId === itemId);
        setMidiasItem(filteredMidias);
      }
    } catch (err) {
      console.error("Erro ao carregar dados no IDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSaving(false);
    setDescricao("");
    clearAudio();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route item changes
  }, [itemId]);

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

        await db.put("mutation_queue", {
          action: "CREATE_MIDIA",
          vistoriaId: id,
          payload: { id: midiaId, tipo: "FOTO", key: newMidia.key, itemId },
          timestamp: Date.now(),
        });

        const updated = await db.getAll("midias");
        setMidiasItem(updated.filter((m) => m.itemId === itemId));
      }
    } catch (err) {
      console.log("Fluxo de foto cancelado ou falhou:", err);
    }
  };

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

            await db.put("mutation_queue", {
              action: "CREATE_MIDIA",
              vistoriaId: id,
              payload: { id: midiaId, tipo: "FOTO", key: newMidia.key, itemId },
              timestamp: Date.now(),
            });

            const updated = await db.getAll("midias");
            setMidiasItem(updated.filter((m) => m.itemId === itemId));
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

  const handleDeleteMidia = async (midiaId: string) => {
    try {
      const db = await getDB();
      if (db) {
        await db.delete("midias", midiaId);

        await db.put("mutation_queue", {
          action: "DELETE_MIDIA",
          vistoriaId: id,
          payload: { id: midiaId, itemId },
          timestamp: Date.now(),
        });

        setMidiasItem((prev) => prev.filter((m) => m.id !== midiaId));
      }
    } catch (err) {
      console.error("Erro ao deletar mídia do IDB:", err);
    }
  };

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

        await db.put("mutation_queue", {
          action: "CREATE_MIDIA",
          vistoriaId: id,
          payload: { id: midiaId, tipo: "AUDIO", key: newMidia.key, itemId },
          timestamp: Date.now(),
        });

        const updated = await db.getAll("midias");
        setMidiasItem(updated.filter((m) => m.itemId === itemId));

        clearAudio();
      }
    } catch (err) {
      console.error("Erro ao salvar áudio no IDB:", err);
    }
  };

  useEffect(() => {
    if (audioBlob) {
      handleSaveAudio();
    }
  }, [audioBlob]);

  const handleSaveItem = async (mode: "next" | "list" = "next") => {
    if (!item || saving) return;

    // D-05: photo required before save
    const fotosNow = midiasItem.filter((m) => m.tipo === "FOTO");
    if (fotosNow.length === 0) {
      return;
    }
    if (!(status === "BOM" || status === "REGULAR" || status === "RUIM")) {
      return;
    }

    setSaving(true);

    const updatedItem = {
      ...item,
      status,
      descricao: descricao.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    try {
      const db = await getDB();
      if (db) {
        await db.put("items", updatedItem);

        await db.put("mutation_queue", {
          action: "UPDATE_ITEM_STATUS",
          vistoriaId: id,
          payload: { id: itemId, status, descricao: updatedItem.descricao },
          timestamp: Date.now(),
        });

        if (mode === "list") {
          router.push(`/field/vistorias/${id}/ambientes/${ambienteId}`);
          return;
        }

        const next = await findNextPendingAfterSave(id, itemId);
        if (next) {
          router.replace(
            buildItemPath(id, next.ambienteId, next.item.id),
          );
        } else {
          router.push(`/field/vistorias/${id}/ambientes/${ambienteId}`);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar item:", err);
      setSaving(false);
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
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Icon name="inventory_2" className="text-[28px] text-slate-400" />
          </div>
          <p className="text-base text-slate-500">
            Dados do item ou cômodo não encontrados.
          </p>
        </div>
      </PhoneShell>
    );
  }

  const fotos = midiasItem.filter((m) => m.tipo === "FOTO");
  const audios = midiasItem.filter((m) => m.tipo === "AUDIO");
  const hasPhoto = fotos.length > 0;
  const hasAudio = audios.length > 0;
  const conditionSet = status === "BOM" || status === "REGULAR" || status === "RUIM";
  // D-05: report is photographic — at least one photo required to save
  const canSave = conditionSet && hasPhoto;

  const waveformHeights = [8, 18, 28, 14, 24, 34, 20, 30, 16, 26, 36, 22, 14, 28, 20, 32, 16, 24, 30, 18, 26];

  const conditions: {
    value: Condition;
    label: string;
    icon: string;
    activeClass: string;
    iconClass: string;
  }[] = [
    {
      value: "BOM",
      label: "Bom estado",
      icon: "check_circle",
      activeClass: "bg-green-50 border-status-good text-status-good",
      iconClass: "text-status-good",
    },
    {
      value: "REGULAR",
      label: "Regular",
      icon: "remove_circle",
      activeClass: "bg-amber-50 border-status-warn text-status-warn",
      iconClass: "text-status-warn",
    },
    {
      value: "RUIM",
      label: "Avariado",
      icon: "cancel",
      activeClass: "bg-red-50 border-status-bad text-status-bad",
      iconClass: "text-status-bad",
    },
  ];

  return (
    <PhoneShell showNav={false}>
      <TopBar
        title="Vistoriar item"
        backTo={`/field/vistorias/${id}/ambientes/${ambienteId}`}
      />

      <main className="flex-1 px-5 pt-1 pb-36 space-y-5">
        {/* Item identity */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="inventory_2" className="text-[24px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary truncate">
              {ambiente.nome}
            </p>
            <h2 className="text-base font-bold text-secondary leading-snug">
              {item.nome}
            </h2>
          </div>
        </div>

        {/* Capture readiness checklist */}
        <div className="grid grid-cols-3 gap-2">
          <ReadinessChip
            ok={hasPhoto}
            icon="photo_camera"
            label={hasPhoto ? `${fotos.length} foto${fotos.length > 1 ? "s" : ""}` : "Foto"}
          />
          <ReadinessChip
            ok={hasAudio}
            icon="mic"
            label={hasAudio ? `${audios.length} áudio${audios.length > 1 ? "s" : ""}` : "Áudio"}
          />
          <ReadinessChip
            ok={conditionSet}
            icon="stars"
            label={
              status === "BOM"
                ? "Bom"
                : status === "REGULAR"
                  ? "Regular"
                  : status === "RUIM"
                    ? "Avariado"
                    : "Estado"
            }
          />
        </div>

        {/* Photos */}
        <section className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-sm font-bold text-secondary flex items-center gap-1.5">
              <Icon name="photo_camera" className="text-[18px] text-primary" />
              Evidências
            </h3>
            <button
              type="button"
              onClick={handleGalleryCapture}
              className="inline-flex items-center gap-1 min-h-[44px] px-3 text-sm font-bold text-primary hover:bg-primary/5 rounded-full transition-colors"
            >
              <Icon name="photo_library" className="text-[18px]" />
              Galeria
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fotos.map((foto, index) => (
              <div
                key={foto.id}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={`Foto ${index + 1} de ${item.nome}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-secondary/70 backdrop-blur px-2 py-0.5 rounded-full text-[11px] text-white font-semibold">
                  Foto {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMidia(foto.id)}
                  aria-label={`Excluir foto ${index + 1}`}
                  className="absolute top-2 right-2 h-11 w-11 min-h-[44px] min-w-[44px] bg-status-bad text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handlePhotoCapture}
              disabled={cameraLoading}
              className="relative aspect-[4/3] min-h-[120px] rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-primary gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              {cameraLoading ? (
                <Icon name="progress_activity" className="text-[32px] animate-spin" />
              ) : (
                <>
                  <span className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-soft">
                    <Icon name="photo_camera" className="text-[28px]" />
                  </span>
                  <span className="text-sm font-bold">Tirar foto</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Audio */}
        <section className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-secondary flex items-center gap-1.5">
            <Icon name="graphic_eq" className="text-[18px] text-primary" />
            Observações em áudio
          </h3>

          {audioError && (
            <p className="text-sm text-status-bad bg-red-50 border border-red-100 rounded-2xl px-3 py-2" role="alert">
              {audioError}
            </p>
          )}

          {isRecording && (
            <div className="bg-red-50 border border-status-bad/20 p-3 rounded-2xl flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-status-bad text-white flex items-center justify-center shrink-0 animate-pulse">
                <Icon name="mic" filled className="text-[20px]" />
              </div>
              <div className="flex-1 flex items-end gap-[2px] h-9 pb-1 overflow-hidden">
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
              <span className="text-sm font-bold text-secondary tabular-nums shrink-0">
                {Math.floor(recordingTime / 60)}:
                {(recordingTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="space-y-2">
            {audios.map((audio, index) => (
              <div
                key={audio.id}
                className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="volume_up" className="text-[20px]" />
                  </span>
                  <div className="text-left min-w-0">
                    <span className="text-sm font-bold text-secondary block">
                      Áudio {index + 1}
                    </span>
                    <span className="text-xs text-slate-400">Gravado no aparelho</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <audio src={audio.url} className="hidden" id={`audio-player-${audio.id}`} controls />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(
                        `audio-player-${audio.id}`,
                      ) as HTMLAudioElement;
                      if (el) el.play();
                    }}
                    aria-label={`Reproduzir áudio ${index + 1}`}
                    className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-white border border-slate-100 text-primary flex items-center justify-center hover:bg-slate-50 shadow-sm active:scale-95"
                  >
                    <Icon name="play_arrow" className="text-[22px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMidia(audio.id)}
                    aria-label={`Excluir áudio ${index + 1}`}
                    className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-white border border-slate-100 text-status-bad flex items-center justify-center hover:bg-red-50 shadow-sm active:scale-95"
                  >
                    <Icon name="delete" className="text-[20px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "w-full h-14 min-h-[56px] rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              isRecording
                ? "bg-status-bad text-white shadow-md"
                : "bg-secondary text-white hover:bg-secondary/90 shadow-sm",
            )}
          >
            <Icon name="mic" filled={isRecording} className="text-[22px]" />
            {isRecording ? "Parar gravação" : "Gravar anotação por voz"}
          </button>
        </section>

        {/* Condition */}
        <section className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-secondary flex items-center gap-1.5">
            <Icon name="stars" className="text-[18px] text-primary" />
            Avaliação do estado
          </h3>

          <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Estado de conservação">
            {conditions.map((c) => {
              const active = status === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setStatus(c.value)}
                  className={cn(
                    "min-h-[72px] py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold active:scale-[0.97]",
                    active
                      ? c.activeClass
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200",
                  )}
                >
                  <Icon
                    name={c.icon}
                    filled={active}
                    className={cn("text-[22px]", active ? c.iconClass : "text-slate-300")}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
          <label
            htmlFor="item-descricao"
            className="text-sm font-bold text-secondary flex items-center gap-1.5"
          >
            <Icon name="rate_review" className="text-[18px] text-primary" />
            Anotações adicionais
          </label>
          <textarea
            id="item-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Observações sobre o estado, avarias ou detalhes deste item…"
            rows={4}
            className="w-full min-h-[112px] text-base p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-secondary placeholder:text-slate-400 bg-slate-50 leading-relaxed resize-y"
          />
          <p className="text-xs text-slate-400">
            Evite termos como &ldquo;laudo&rdquo; — use descrição técnica do relatório fotográfico.
          </p>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background-light via-background-light to-transparent md:max-w-md md:mx-auto z-20 space-y-2">
        {!hasPhoto && (
          <p className="text-center text-xs text-status-bad font-semibold bg-red-50 border border-status-bad/15 rounded-2xl px-3 py-2">
            Tire ao menos 1 foto — o relatório precisa de evidência visual.
          </p>
        )}
        {hasPhoto && !conditionSet && (
          <p className="text-center text-xs text-slate-500 font-medium">
            Selecione o estado de conservação para salvar.
          </p>
        )}
        {hasPhoto && conditionSet && !hasAudio && (
          <p className="text-center text-xs text-slate-500 font-medium">
            Áudio opcional — melhora a descrição por IA após o sync.
          </p>
        )}
        <Button
          type="button"
          onClick={() => handleSaveItem("next")}
          disabled={!canSave || saving}
          fullWidth
          size="lg"
          className="shadow-lg shadow-primary/25"
        >
          {saving ? (
            <>
              <Icon name="progress_activity" className="text-[22px] animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              <Icon name="arrow_forward" className="text-[22px]" />
              Salvar e próximo
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={() => handleSaveItem("list")}
          disabled={!canSave || saving}
          className="w-full min-h-[44px] text-sm font-bold text-primary hover:underline disabled:opacity-40 disabled:no-underline"
        >
          Salvar e voltar à lista
        </button>
      </div>
    </PhoneShell>
  );
}

function ReadinessChip({
  ok,
  icon,
  label,
}: {
  ok: boolean;
  icon: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-2 py-2.5 flex flex-col items-center gap-1 text-center min-h-[64px] justify-center",
        ok
          ? "bg-green-50 border-status-good/30 text-status-good"
          : "bg-white border-slate-100 text-slate-400",
      )}
    >
      <Icon name={ok ? "check_circle" : icon} filled={ok} className="text-[18px]" />
      <span className="text-[11px] font-bold leading-tight">{label}</span>
    </div>
  );
}
