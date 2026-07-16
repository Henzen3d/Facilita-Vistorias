"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { getDB, LocalAmbiente, LocalItem, LocalChecklistChegada } from "@/lib/db/idb";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Filter = "all" | "pending" | "issues";

// Checklist fields with labels and icons
const CHECKLIST_FIELDS: { key: keyof Omit<LocalChecklistChegada, "id" | "vistoriaId" | "outrosItens">; label: string; icon: string }[] = [
  { key: "cheiroGasOk", label: "Sem cheiro de Gás (Segurança)", icon: "local_fire_department" },
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

// Icon options for new room
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

  // Add room modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomIcon, setNewRoomIcon] = useState("meeting_room");
  const [addingRoom, setAddingRoom] = useState(false);

  // Checklist collapse state
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        // Fetch all environments for this vistoria
        const allAmbientes = await db.getAll("ambientes");
        const filteredAmbientes = allAmbientes.filter(a => a.vistoriaId === id);
        
        // Fetch all items
        const allItems = await db.getAll("items");
        // Get only items belonging to the filtered environments
        const ambIds = filteredAmbientes.map(a => a.id);
        const filteredItems = allItems.filter(i => ambIds.includes(i.ambienteId));

        // Fetch checklist
        const checklists = await db.getAll("checklistChegada");
        const localChecklist = checklists.find(c => c.vistoriaId === id) || {
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
          outrosItens: null
        };

        setAmbientes(filteredAmbientes);
        setItems(filteredItems);
        setChecklist(localChecklist);

        // Se o checklist estiver completo, colapsar por padrão
        const chkDone = CHECKLIST_FIELDS.filter(f => localChecklist[f.key]).length;
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

  const handleChecklistChange = async (key: keyof Omit<LocalChecklistChegada, "id" | "vistoriaId" | "outrosItens">) => {
    if (!checklist) return;

    const updatedChecklist = {
      ...checklist,
      [key]: !checklist[key]
    };

    setChecklist(updatedChecklist);

    // Se acabou de completar todos os itens, colapsar
    const chkDone = CHECKLIST_FIELDS.filter(f => updatedChecklist[f.key]).length;
    if (chkDone === CHECKLIST_FIELDS.length) {
      setChecklistCollapsed(true);
    }

    try {
      const db = await getDB();
      if (db) {
        await db.put("checklistChegada", updatedChecklist);
        
        // Queue the mutation for syncing
        await db.put("mutation_queue", {
          action: "UPDATE_CHECKLIST",
          vistoriaId: id,
          payload: updatedChecklist,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error("Erro ao salvar checklist no IDB:", err);
    }
  };

  // Handle add new room
  const handleAddAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || addingRoom) return;

    setAddingRoom(true);
    try {
      const db = await getDB();
      if (db) {
        const novoId = `amb-local-${Date.now()}`;
        const novoAmbiente: LocalAmbiente = {
          id: novoId,
          nome: newRoomName.trim(),
          ordem: ambientes.length + 1,
          vistoriaId: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.put("ambientes", novoAmbiente);

        // Add to mutation queue
        await db.put("mutation_queue", {
          action: "UPDATE_VISTORIA_STATUS" as any,
          vistoriaId: id,
          payload: { tipo: "CREATE_AMBIENTE", ambiente: novoAmbiente },
          timestamp: Date.now(),
        });

        setAmbientes(prev => [...prev, novoAmbiente]);
        setNewRoomName("");
        setNewRoomIcon("meeting_room");
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Erro ao criar ambiente no IDB:", err);
    } finally {
      setAddingRoom(false);
    }
  };

  // Icon mapper helper
  const getRoomIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("cozinha")) return "kitchen";
    if (n.includes("sala") || n.includes("estar")) return "weekend";
    if (n.includes("quarto") || n.includes("dormitório")) return "bed";
    if (n.includes("banheiro") || n.includes("suite") || n.includes("suíte")) return "bathtub";
    if (n.includes("serviço") || n.includes("lavanderia")) return "local_laundry_service";
    if (n.includes("sacada") || n.includes("varanda")) return "balcony";
    return "meeting_room";
  };

  // Calculate checklist progress
  const checklistDone = checklist
    ? CHECKLIST_FIELDS.filter(f => checklist[f.key]).length
    : 0;
  const checklistTotal = CHECKLIST_FIELDS.length;
  const checklistPct = Math.round((checklistDone / checklistTotal) * 100);
  const checklistComplete = checklistDone === checklistTotal;

  // Calculate items statistics
  const itemsDone = items.filter(i => i.status !== "PENDENTE");
  const totalDone = itemsDone.length;
  const totalItems = items.length;
  const itemsPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // Rebalanced progress: Cadastro (15%) + Checklist (10%) + Itens Vistoriados (75%)
  const cadastroPct = 15;
  const checklistPctContri = Math.round(checklistPct * 0.10);
  const itemsPctContri = totalItems > 0 ? Math.round(itemsPct * 0.75) : 0;
  const pct = cadastroPct + checklistPctContri + itemsPctContri;

  // Group rooms with items details
  const roomsData = ambientes.map(amb => {
    const roomItems = items.filter(i => i.ambienteId === amb.id);
    const roomDone = roomItems.filter(i => i.status !== "PENDENTE").length;
    
    let status: "good" | "warn" | "bad" | "todo" = "todo";
    
    if (roomItems.length > 0) {
      const hasBad = roomItems.some(i => i.status === "RUIM");
      const hasWarn = roomItems.some(i => i.status === "REGULAR");
      
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
      status
    };
  });

  const statusMap = {
    good: { color: "bg-status-good", label: "Excelente", ring: "ring-status-good/20" },
    warn: { color: "bg-status-warn", label: "Atenção / Pendências", ring: "ring-status-warn/20" },
    bad: { color: "bg-status-bad", label: "Avarias detectadas", ring: "ring-status-bad/20" },
    todo: { color: "bg-slate-300", label: "Não iniciado", ring: "ring-slate-200" },
  };

  // Filter list
  const filteredRooms = roomsData.filter(r => {
    if (filter === "pending") return r.doneCount < r.itemsCount || r.itemsCount === 0;
    if (filter === "issues") return r.status === "warn" || r.status === "bad";
    return true;
  });

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
      <TopBar title="Cômodos da Vistoria" backTo={`/field/vistorias/${id}`} />

      {/* Protocolo de Chegada — Redesigned as Toggle Cards */}
      {checklist && (
        <section className="mx-5 mb-5 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <div 
            onClick={() => setChecklistCollapsed(!checklistCollapsed)}
            className="flex items-center justify-between cursor-pointer"
          >
            <h3 className="font-bold text-sm text-[#00AEEF] flex items-center gap-1.5 select-none">
              <Icon name="shield" filled className="text-[18px]" />
              Protocolo de Chegada {checklistComplete && checklistCollapsed && " (Concluído)"}
            </h3>
            <div className="flex items-center gap-2">
              {checklistComplete ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-status-good bg-status-good/10 border border-status-good/20 px-2.5 py-1 rounded-full">
                  <Icon name="check_circle" filled className="text-[12px]" />
                  Concluído
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-400">
                  {checklistDone}/{checklistTotal}
                </span>
              )}
              <Icon 
                name={checklistCollapsed ? "keyboard_arrow_down" : "keyboard_arrow_up"} 
                className="text-slate-400 text-[20px]" 
              />
            </div>
          </div>

          {!checklistCollapsed && (
            <>
              {/* Checklist progress bar */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${checklistComplete ? "bg-status-good" : "bg-primary"}`}
                    style={{ width: `${checklistPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Verificações de segurança obrigatórias antes de iniciar
                </p>
              </div>

              {/* Toggle Cards */}
              <div className="grid grid-cols-1 gap-2">
                {CHECKLIST_FIELDS.map(({ key, label, icon }) => {
                  const checked = checklist[key] as boolean;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleChecklistChange(key)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                        checked
                          ? "bg-status-good/8 border-status-good/30 text-status-good"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        checked ? "bg-status-good/15" : "bg-white border border-slate-100"
                      }`}>
                        <Icon name={icon} filled={checked} className={`text-[18px] ${checked ? "text-status-good" : "text-slate-400"}`} />
                      </span>
                      <span className={`flex-1 text-xs font-semibold ${checked ? "text-status-good line-through opacity-70" : "text-secondary"}`}>
                        {label}
                      </span>
                      <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked ? "bg-status-good border-status-good" : "border-slate-300"
                      }`}>
                        {checked && <Icon name="check" className="text-white text-[12px]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* Progress Circle visual */}
      <div className="px-5">
        <div className="rounded-3xl bg-secondary text-white p-5 shadow-lg shadow-secondary/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">Progresso da vistoria</p>
              <p className="text-2xl font-bold mt-1">{pct}%</p>
              <div className="flex gap-3 mt-1">
                <p className="text-[10px] text-white/50">
                  <span className="text-white/70 font-semibold">Protocolo:</span> {checklistDone}/{checklistTotal}
                </p>
                {totalItems > 0 && (
                  <p className="text-[10px] text-white/50">
                    <span className="text-white/70 font-semibold">Itens:</span> {totalDone}/{totalItems}
                  </p>
                )}
              </div>
            </div>
            <div className="relative h-16 w-16 select-none">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#00aeef"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                {pct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-5 mt-5 flex items-center gap-2 overflow-x-auto pb-1 select-none">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-bold border transition-colors ${
            filter === "all"
              ? "bg-secondary text-white border-secondary"
              : "bg-white text-secondary border-slate-100 shadow-sm"
          }`}
        >
          Todos
          <span className={`text-[10px] px-1.5 rounded-full ${filter === "all" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-400"}`}>
            {roomsData.length}
          </span>
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-bold border transition-colors ${
            filter === "pending"
              ? "bg-secondary text-white border-secondary"
              : "bg-white text-secondary border-slate-100 shadow-sm"
          }`}
        >
          Pendentes
          <span className={`text-[10px] px-1.5 rounded-full ${filter === "pending" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-400"}`}>
            {roomsData.filter(r => r.doneCount < r.itemsCount || r.itemsCount === 0).length}
          </span>
        </button>
        <button
          onClick={() => setFilter("issues")}
          className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-bold border transition-colors ${
            filter === "issues"
              ? "bg-secondary text-white border-secondary"
              : "bg-white text-secondary border-slate-100 shadow-sm"
          }`}
        >
          Avarias
          <span className={`text-[10px] px-1.5 rounded-full ${filter === "issues" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-400"}`}>
            {roomsData.filter(r => r.status === "warn" || r.status === "bad").length}
          </span>
        </button>
      </div>

      {/* Environments List */}
      <ul className="px-5 mt-4 flex flex-col gap-3 pb-28">
        {filteredRooms.length === 0 && (
          <li className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Icon name="meeting_room" className="text-[32px] text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Nenhum cômodo encontrado</p>
            <p className="text-xs text-slate-300">Adicione cômodos usando o botão abaixo</p>
          </li>
        )}
        {filteredRooms.map((r) => {
          const s = statusMap[r.status];
          const pctRoom = r.itemsCount > 0 ? Math.round((r.doneCount / r.itemsCount) * 100) : 0;
          return (
            <li key={r.id}>
              {/* Dynamic redirection: links to the capture page of the first item of this room */}
              <Link
                href={`/field/vistorias/${id}/ambientes/${r.id}`}
                className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-4 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Icon name={getRoomIcon(r.nome)} className="text-secondary text-[24px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ring-4 ${s.ring} ${s.color}`} />
                    <p className="text-[14px] font-bold text-secondary truncate">{r.nome}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {r.itemsCount > 0 ? s.label : "Sem itens cadastrados"}
                  </p>
                  {r.itemsCount > 0 && (
                    <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.color}`}
                        style={{ width: `${pctRoom}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {r.itemsCount > 0 ? (
                    <>
                      <div className="text-sm font-bold text-secondary">{pctRoom}%</div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {r.doneCount}/{r.itemsCount}
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] font-semibold text-slate-300">0 itens</div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Sticky Footer: Add Room + Finalize */}
      <div className="fixed bottom-[80px] left-0 right-0 px-5 pb-3 bg-gradient-to-t from-background-light via-background-light to-background-light/0 md:max-w-md md:mx-auto md:left-0 md:right-0 z-30">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full h-14 rounded-full bg-white border-2 border-primary/20 text-primary text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:bg-primary/5 transition-all active:scale-[0.98]"
        >
          <Icon name="add_circle" className="text-[20px]" />
          Adicionar Cômodo
        </button>

        <Link
          href={`/field/vistorias/${id}/resumo`}
          className="block text-center text-xs font-bold text-primary py-3 hover:underline"
        >
          Revisar e Finalizar Vistoria →
        </Link>
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 px-0">
          <div
            className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: "448px" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-secondary">Adicionar Novo Cômodo</h3>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setNewRoomName(""); }}
                className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <Icon name="close" className="text-[20px] text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddAmbiente} className="flex flex-col gap-5">
              {/* Room name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Nome do Cômodo <span className="text-status-bad">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Banheiro Social, Varanda, Garagem..."
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder-slate-300"
                  required
                  autoFocus
                />
              </div>

              {/* Icon picker */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Tipo de Cômodo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROOM_ICONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewRoomIcon(opt.value)}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all ${
                        newRoomIcon === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-primary/30"
                      }`}
                    >
                      <Icon name={opt.icon} className="text-[22px]" />
                      <span className="text-[10px] font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setNewRoomName(""); }}
                  className="flex-1 py-3.5 border border-slate-200 text-secondary font-bold rounded-full text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newRoomName.trim() || addingRoom}
                  className="flex-1 py-3.5 bg-primary text-white font-bold rounded-full text-sm shadow-sm hover:bg-[#009acd] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingRoom ? (
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
