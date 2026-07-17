"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getDB,
  LocalAmbiente,
  LocalItem,
  LocalChecklistChegada,
  LocalMidia,
} from "@/lib/db/idb";
import {
  applyPropertyTemplate,
  createAmbienteWithDefaultItems,
  TemplateApplyError,
} from "@/lib/field/applyTemplate";
import { PROPERTY_TEMPLATES } from "@/lib/field/templates";
import { computeCompletionScore } from "@/lib/field/completionScore";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Filter = "all" | "pending" | "issues";

const CHECKLIST_FIELDS: {
  key: keyof Omit<LocalChecklistChegada, "id" | "vistoriaId" | "outrosItens">;
  label: string;
  icon: string;
}[] = [
  { key: "cheiroGasOk", label: "Sem cheiro de gás (segurança)", icon: "local_fire_department" },
  { key: "luzesLigadas", label: "Ligar todas as luzes", icon: "lightbulb" },
  { key: "janelasAbertas", label: "Abrir todas as janelas", icon: "window" },
  { key: "arCondicionadoLigado", label: "Testar ar-condicionado", icon: "ac_unit" },
  { key: "aguaQuenteLigada", label: "Testar água quente", icon: "water_drop" },
  { key: "descargasTestadas", label: "Testar descargas", icon: "bathroom" },
  { key: "chuveirosTestados", label: "Testar chuveiros", icon: "shower" },
  { key: "disjuntoresChecados", label: "Verificar disjuntores", icon: "electrical_services" },
  { key: "interfoneTestado", label: "Testar interfone", icon: "phone_in_talk" },
  { key: "portaoGaragemTestado", label: "Testar portão da garagem", icon: "garage" },
];

const ROOM_ICONS = [
  { value: "bed", label: "Quarto", icon: "bed" },
  { value: "weekend", label: "Sala", icon: "weekend" },
  { value: "kitchen", label: "Cozinha", icon: "kitchen" },
  { value: "bathtub", label: "Banheiro", icon: "bathtub" },
  { value: "balcony", label: "Varanda", icon: "balcony" },
  { value: "meeting_room", label: "Outro", icon: "meeting_room" },
];

export default function FieldVistoriaAmbientes({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [ambientes, setAmbientes] = useState<LocalAmbiente[]>([]);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [checklist, setChecklist] = useState<LocalChecklistChegada | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomIcon, setNewRoomIcon] = useState("meeting_room");
  const [addingRoom, setAddingRoom] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  const [midias, setMidias] = useState<LocalMidia[]>([]);

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        const allAmbientes = await db.getAll("ambientes");
        const filteredAmbientes = allAmbientes.filter((a) => a.vistoriaId === id);

        const allItems = await db.getAll("items");
        const ambIds = filteredAmbientes.map((a) => a.id);
        const filteredItems = allItems.filter((i) => ambIds.includes(i.ambienteId));

        const checklists = await db.getAll("checklistChegada");
        const localChecklist = checklists.find((c) => c.vistoriaId === id) || {
          id: `chk-${id}`,
          vistoriaId: id,
          cheiroGasOk: false,
          luzesLigadas: false,
          janelasAbertas: false,
          arCondicionadoLigado: false,
          aguaQuenteLigada: false,
          descargasTestadas: false,
          chuveirosTestados: false,
          disjuntoresChecados: false,
          interfoneTestado: false,
          portaoGaragemTestado: false,
          outrosItens: null,
        };

        setAmbientes(filteredAmbientes);
        setItems(filteredItems);
        setChecklist(localChecklist);

        const allMidias = await db.getAll("midias");
        const itemIds = new Set(filteredItems.map((i) => i.id));
        setMidias(allMidias.filter((m) => itemIds.has(m.itemId)));

        const chkDone = CHECKLIST_FIELDS.filter((f) => localChecklist[f.key]).length;
        if (chkDone === CHECKLIST_FIELDS.length) {
          setChecklistCollapsed(true);
        }
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

  const handleChecklistChange = async (
    key: keyof Omit<LocalChecklistChegada, "id" | "vistoriaId" | "outrosItens">,
  ) => {
    if (!checklist) return;

    const updatedChecklist = {
      ...checklist,
      [key]: !checklist[key],
    };

    setChecklist(updatedChecklist);

    const chkDone = CHECKLIST_FIELDS.filter((f) => updatedChecklist[f.key]).length;
    if (chkDone === CHECKLIST_FIELDS.length) {
      setChecklistCollapsed(true);
    }

    try {
      const db = await getDB();
      if (db) {
        await db.put("checklistChegada", updatedChecklist);

        await db.put("mutation_queue", {
          action: "UPDATE_CHECKLIST",
          vistoriaId: id,
          payload: updatedChecklist,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Erro ao salvar checklist no IDB:", err);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (applyingTemplateId) return;
    setApplyingTemplateId(templateId);
    setTemplateError(null);
    setTemplateMessage(null);
    try {
      const result = await applyPropertyTemplate(id, templateId);
      setTemplateMessage(
        `${result.template.label}: ${result.ambientes} cômodos e ${result.items} itens criados`,
      );
      await loadData();
    } catch (err) {
      const msg =
        err instanceof TemplateApplyError
          ? err.message
          : "Não foi possível aplicar o modelo";
      setTemplateError(msg);
      console.error("Erro ao aplicar template:", err);
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const handleAddAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || addingRoom) return;

    setAddingRoom(true);
    setTemplateError(null);
    try {
      const { ambiente, items: newItems } = await createAmbienteWithDefaultItems(
        id,
        newRoomName.trim(),
      );
      setAmbientes((prev) => [...prev, ambiente]);
      setItems((prev) => [...prev, ...newItems]);
      setNewRoomName("");
      setNewRoomIcon("meeting_room");
      setShowAddModal(false);
      setTemplateMessage(
        `${ambiente.nome}: ${newItems.length} item${newItems.length === 1 ? "" : "s"} padrão adicionado${newItems.length === 1 ? "" : "s"}`,
      );
    } catch (err) {
      console.error("Erro ao criar ambiente no IDB:", err);
      setTemplateError("Não foi possível criar o cômodo");
    } finally {
      setAddingRoom(false);
    }
  };

  const getRoomIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("cozinha")) return "kitchen";
    if (n.includes("sala") || n.includes("estar")) return "weekend";
    if (n.includes("quarto") || n.includes("dormitório")) return "bed";
    if (n.includes("banheiro") || n.includes("suite") || n.includes("suíte")) return "bathtub";
    if (n.includes("serviço") || n.includes("lavanderia")) return "local_laundry_service";
    if (n.includes("sacada") || n.includes("varanda")) return "balcony";
    return newRoomIcon || "meeting_room";
  };

  const checklistDone = checklist
    ? CHECKLIST_FIELDS.filter((f) => checklist[f.key]).length
    : 0;
  const checklistTotal = CHECKLIST_FIELDS.length;
  const checklistPct = Math.round((checklistDone / checklistTotal) * 100);
  const checklistComplete = checklistDone === checklistTotal;

  const itemsDone = items.filter((i) => i.status !== "PENDENTE");
  const totalDone = itemsDone.length;
  const totalItems = items.length;

  const completion = computeCompletionScore({
    vistoriaId: id,
    checklist,
    ambientes,
    items,
    midias,
  });
  const pct = completion.percent;
  const checklistPctContri = Math.round(
    (completion.stats.checklistDone / Math.max(1, completion.stats.checklistTotal)) * 10,
  );
  const itemsPctContri = Math.round(
    totalItems > 0 ? (totalDone / totalItems) * 40 : 0,
  );
  const fotoPctContri = Math.round(
    totalItems > 0
      ? ((totalItems - completion.stats.itemsWithoutPhoto) / totalItems) * 40
      : 0,
  );

  const roomsData = ambientes.map((amb) => {
    const roomItems = items.filter((i) => i.ambienteId === amb.id);
    const roomDone = roomItems.filter((i) => i.status !== "PENDENTE").length;

    let status: "good" | "warn" | "bad" | "todo" = "todo";

    if (roomItems.length > 0) {
      const hasBad = roomItems.some((i) => i.status === "RUIM");
      const hasWarn = roomItems.some((i) => i.status === "REGULAR");

      if (roomDone === 0) {
        status = "todo";
      } else if (hasBad) {
        status = "bad";
      } else if (hasWarn || roomDone < roomItems.length) {
        status = "warn";
      } else {
        status = "good";
      }
    }

    return {
      ...amb,
      itemsCount: roomItems.length,
      doneCount: roomDone,
      status,
    };
  });

  const statusMap = {
    good: {
      color: "bg-status-good",
      label: "Excelente",
      ring: "ring-status-good/20",
      accent: "border-l-status-good",
      bar: "bg-status-good",
    },
    warn: {
      color: "bg-status-warn",
      label: "Atenção / pendências",
      ring: "ring-status-warn/20",
      accent: "border-l-status-warn",
      bar: "bg-status-warn",
    },
    bad: {
      color: "bg-status-bad",
      label: "Avarias detectadas",
      ring: "ring-status-bad/20",
      accent: "border-l-status-bad",
      bar: "bg-status-bad",
    },
    todo: {
      color: "bg-slate-300",
      label: "Não iniciado",
      ring: "ring-slate-200",
      accent: "border-l-slate-300",
      bar: "bg-slate-300",
    },
  };

  const filteredRooms = roomsData.filter((r) => {
    if (filter === "pending") return r.doneCount < r.itemsCount || r.itemsCount === 0;
    if (filter === "issues") return r.status === "warn" || r.status === "bad";
    return true;
  });

  const pendingCount = roomsData.filter(
    (r) => r.doneCount < r.itemsCount || r.itemsCount === 0,
  ).length;
  const issuesCount = roomsData.filter(
    (r) => r.status === "warn" || r.status === "bad",
  ).length;

  if (loading) {
    return (
      <PhoneShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <Icon name="progress_activity" className="text-3xl text-primary animate-spin" />
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell showNav={true}>
      <TopBar title="Cômodos da vistoria" backTo={`/field/vistorias/${id}`} />

      {checklist && (
        <section className="mx-5 mb-4 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-3">
          <button
            type="button"
            onClick={() => setChecklistCollapsed(!checklistCollapsed)}
            className="w-full flex items-center justify-between gap-2 min-h-[44px] text-left"
          >
            <h3 className="font-bold text-sm text-primary flex items-center gap-1.5 select-none">
              <Icon name="shield" filled className="text-[18px]" />
              Protocolo de chegada
            </h3>
            <div className="flex items-center gap-2">
              {checklistComplete ? (
                <Badge tone="good">
                  <Icon name="check_circle" filled className="text-[12px]" />
                  Concluído
                </Badge>
              ) : (
                <span className="text-sm font-bold text-slate-400 tabular-nums">
                  {checklistDone}/{checklistTotal}
                </span>
              )}
              <Icon
                name={checklistCollapsed ? "keyboard_arrow_down" : "keyboard_arrow_up"}
                className="text-slate-400 text-[22px]"
              />
            </div>
          </button>

          {!checklistCollapsed && (
            <>
              <Progress
                value={checklistPct}
                size="sm"
                barClassName={checklistComplete ? "bg-status-good" : "bg-primary"}
                label="Verificações de segurança"
                meta={`${checklistPct}%`}
              />

              <div className="grid grid-cols-1 gap-2">
                {CHECKLIST_FIELDS.map(({ key, label, icon }) => {
                  const checked = checklist[key] as boolean;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleChecklistChange(key)}
                      className={cn(
                        "flex items-center gap-3 p-3 min-h-[52px] rounded-2xl border text-left transition-all duration-200 active:scale-[0.98]",
                        checked
                          ? "bg-green-50 border-status-good/30 text-status-good"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:border-primary/30 hover:bg-primary/5",
                      )}
                    >
                      <span
                        className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                          checked ? "bg-status-good/15" : "bg-white border border-slate-100",
                        )}
                      >
                        <Icon
                          name={icon}
                          filled={checked}
                          className={cn(
                            "text-[20px]",
                            checked ? "text-status-good" : "text-slate-400",
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          "flex-1 text-sm font-semibold",
                          checked ? "text-status-good line-through opacity-70" : "text-secondary",
                        )}
                      >
                        {label}
                      </span>
                      <span
                        className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          checked ? "bg-status-good border-status-good" : "border-slate-300",
                        )}
                      >
                        {checked && <Icon name="check" className="text-white text-[14px]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* Template picker — only when no rooms yet */}
      {ambientes.length === 0 && (
        <section className="mx-5 mb-4 bg-white border border-primary/20 p-4 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="dashboard_customize" className="text-[22px]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-secondary">Começar com um modelo</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Cria cômodos e itens padrão em um toque. Você pode ajustar depois.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {PROPERTY_TEMPLATES.map((t) => {
              const busy = applyingTemplateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!!applyingTemplateId}
                  onClick={() => handleApplyTemplate(t.id)}
                  className={cn(
                    "w-full text-left min-h-[52px] rounded-2xl border px-4 py-3 transition-all active:scale-[0.99]",
                    busy
                      ? "border-primary bg-primary/5"
                      : "border-slate-100 bg-slate-50 hover:border-primary/40 hover:bg-primary/5",
                    applyingTemplateId && !busy && "opacity-50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-secondary">{t.label}</p>
                      <p className="text-xs text-slate-500 truncate">{t.description}</p>
                    </div>
                    {busy ? (
                      <Icon name="progress_activity" className="text-primary text-[20px] animate-spin shrink-0" />
                    ) : (
                      <Icon name="chevron_right" className="text-slate-400 text-[20px] shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {(templateMessage || templateError) && (
        <div className="mx-5 mb-3">
          {templateMessage && (
            <p className="text-xs font-semibold text-status-good bg-green-50 border border-status-good/20 rounded-2xl px-3 py-2">
              {templateMessage}
            </p>
          )}
          {templateError && (
            <p className="text-xs font-semibold text-status-bad bg-red-50 border border-status-bad/20 rounded-2xl px-3 py-2" role="alert">
              {templateError}
            </p>
          )}
        </div>
      )}

      {/* Overall progress */}
      <div className="px-5">
        <div className="rounded-3xl bg-secondary text-white p-5 shadow-lg shadow-secondary/15">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/60">
                Progresso da vistoria
              </p>
              <p className="text-3xl font-bold mt-1 tabular-nums">{pct}%</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                <p className="text-xs text-white/60">
                  <span className="text-white/85 font-semibold">Protocolo</span>{" "}
                  {checklistDone}/{checklistTotal}
                </p>
                <p className="text-xs text-white/60">
                  <span className="text-white/85 font-semibold">Itens</span>{" "}
                  {totalItems > 0 ? `${totalDone}/${totalItems}` : "—"}
                </p>
                <p className="text-xs text-white/60">
                  <span className="text-white/85 font-semibold">Fotos</span>{" "}
                  {totalItems > 0
                    ? `${totalItems - completion.stats.itemsWithoutPhoto}/${totalItems}`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="relative h-18 w-18 h-[72px] w-[72px] shrink-0 select-none">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#00AEEF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
                {pct}%
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniMetric
              label="Protocolo"
              value={`${checklistPctContri}%`}
              done={checklistComplete}
            />
            <MiniMetric
              label="Itens"
              value={`${itemsPctContri}%`}
              done={totalItems > 0 && totalDone === totalItems}
            />
            <MiniMetric
              label="Fotos"
              value={`${fotoPctContri}%`}
              done={
                totalItems > 0 && completion.stats.itemsWithoutPhoto === 0
              }
            />
          </div>
        </div>
      </div>

      {/* Filters — max 3 chips (Hick) */}
      <div className="px-5 mt-5 flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {(
          [
            { key: "all" as const, label: "Todos", count: roomsData.length },
            { key: "pending" as const, label: "Pendentes", count: pendingCount },
            { key: "issues" as const, label: "Avarias", count: issuesCount },
          ] as const
        ).map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setFilter(chip.key)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 h-11 min-h-[44px] px-4 rounded-full text-sm font-bold border transition-colors",
              filter === chip.key
                ? "bg-secondary text-white border-secondary"
                : "bg-white text-secondary border-slate-100 shadow-sm",
            )}
          >
            {chip.label}
            <span
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full tabular-nums",
                filter === chip.key ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
              )}
            >
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      <ul className="px-5 mt-4 flex flex-col gap-3 pb-36">
        {filteredRooms.length === 0 && (
          <li className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-white border border-slate-100 rounded-3xl">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Icon name="meeting_room" className="text-[32px] text-slate-300" />
            </div>
            <p className="text-base font-semibold text-slate-500">
              {ambientes.length === 0
                ? "Nenhum cômodo ainda"
                : "Nenhum cômodo neste filtro"}
            </p>
            <p className="text-sm text-slate-400 px-4">
              {ambientes.length === 0
                ? "Aplique um modelo acima ou adicione um cômodo manualmente"
                : "Adicione cômodos ou limpe o filtro"}
            </p>
          </li>
        )}
        {filteredRooms.map((r) => {
          const s = statusMap[r.status];
          const pctRoom = r.itemsCount > 0 ? Math.round((r.doneCount / r.itemsCount) * 100) : 0;
          return (
            <li key={r.id}>
              <Link
                href={`/field/vistorias/${id}/ambientes/${r.id}`}
                className={cn(
                  "bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-4 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 active:scale-[0.99]",
                  s.accent,
                )}
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Icon name={getRoomIcon(r.nome)} className="text-secondary text-[24px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full ring-4 shrink-0", s.ring, s.color)} />
                    <p className="text-sm font-bold text-secondary truncate">{r.nome}</p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {r.itemsCount > 0 ? s.label : "Sem itens — toque para adicionar"}
                  </p>
                  {r.itemsCount > 0 && (
                    <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", s.bar)}
                        style={{ width: `${pctRoom}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {r.itemsCount > 0 ? (
                    <>
                      <div className="text-sm font-bold text-secondary tabular-nums">
                        {pctRoom}%
                      </div>
                      <div className="text-xs font-semibold text-slate-400 tabular-nums">
                        {r.doneCount}/{r.itemsCount}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-semibold text-primary">Abrir</div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="fixed bottom-[80px] left-0 right-0 px-5 pb-2 pt-3 bg-gradient-to-t from-background-light via-background-light to-transparent md:max-w-md md:mx-auto z-30 space-y-2">
        <Button
          onClick={() => setShowAddModal(true)}
          variant="outline"
          fullWidth
          size="lg"
          className="border-2 border-primary/25 text-primary bg-white shadow-md"
        >
          <Icon name="add_circle" className="text-[22px]" />
          Adicionar cômodo
        </Button>

        <Link
          href={`/field/vistorias/${id}/resumo`}
          className="block text-center text-sm font-bold text-primary py-3 min-h-[44px] hover:underline"
        >
          Revisar e finalizar vistoria →
        </Link>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div
            className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: "448px" }}
            role="dialog"
            aria-labelledby="add-room-title"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="add-room-title" className="text-base font-bold text-secondary">
                Adicionar novo cômodo
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewRoomName("");
                }}
                aria-label="Fechar"
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <Icon name="close" className="text-[20px] text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddAmbiente} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-room-name"
                  className="text-xs uppercase tracking-wider font-bold text-slate-400"
                >
                  Nome do cômodo <span className="text-status-bad">*</span>
                </label>
                <input
                  id="new-room-name"
                  type="text"
                  placeholder="Ex: Banheiro social, varanda, garagem…"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder:text-slate-300"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Tipo de cômodo
                </span>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tipo de cômodo">
                  {ROOM_ICONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewRoomIcon(opt.value)}
                      className={cn(
                        "p-3 min-h-[72px] rounded-2xl flex flex-col items-center gap-1.5 border transition-all",
                        newRoomIcon === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-primary/30",
                      )}
                    >
                      <Icon name={opt.icon} className="text-[22px]" />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRoomName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  disabled={!newRoomName.trim() || addingRoom}
                >
                  {addingRoom ? (
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

function MiniMetric({
  label,
  value,
  done,
}: {
  label: string;
  value: string;
  done?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-2 py-2 text-center border",
        done ? "bg-primary/15 border-primary/20" : "bg-white/5 border-white/10",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums text-white mt-0.5">{value}</p>
    </div>
  );
}
