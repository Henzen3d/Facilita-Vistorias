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

export default function FieldVistoriaAmbientes({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [ambientes, setAmbientes] = useState<LocalAmbiente[]>([]);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [checklist, setChecklist] = useState<LocalChecklistChegada | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

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

  // Calculate statistics
  const itemsDone = items.filter(i => i.status !== "PENDENTE");
  const totalDone = itemsDone.length;
  const totalItems = items.length;
  const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // Group rooms with items details
  const roomsData = ambientes.map(amb => {
    const roomItems = items.filter(i => i.ambienteId === amb.id);
    const roomDone = roomItems.filter(i => i.status !== "PENDENTE").length;
    
    // Determine overall room status
    // good: all done and status are BOM
    // warn: some done, or some have REGULAR
    // bad: some have RUIM/Danos
    // todo: 0 done
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
    if (filter === "pending") return r.doneCount < r.itemsCount;
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

      {/* Protocolo de Chegada */}
      {checklist && (
        <section className="mx-5 mb-5 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#00AEEF] flex items-center gap-1.5 select-none">
            <Icon name="shield" filled className="text-[18px]" />
            Protocolo de Chegada
          </h3>
          <p className="text-[11px] text-slate-400 select-none">
            Verificações de segurança obrigatórias no imóvel antes de iniciar:
          </p>
          
          <div className="grid grid-cols-1 gap-2.5">
            <label className="flex items-start gap-2.5 text-xs text-secondary font-medium cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={checklist.cheiroGasOk} 
                onChange={() => handleChecklistChange("cheiroGasOk")}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" 
              />
              <span>Sem cheiro de Gás (Segurança)</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-secondary font-medium cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={checklist.luzesLigadas} 
                onChange={() => handleChecklistChange("luzesLigadas")}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" 
              />
              <span>Ligar todas as luzes</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-secondary font-medium cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={checklist.janelasAbertas} 
                onChange={() => handleChecklistChange("janelasAbertas")}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" 
              />
              <span>Abrir todas as janelas</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-secondary font-medium cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={checklist.arCondicionadoLigado} 
                onChange={() => handleChecklistChange("arCondicionadoLigado")}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" 
              />
              <span>Testar aparelhos de ar-condicionado</span>
            </label>
          </div>
        </section>
      )}

      {/* Progress Circle visual */}
      <div className="px-5">
        <div className="rounded-3xl bg-secondary text-white p-5 shadow-lg shadow-secondary/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">Progresso da vistoria</p>
              <p className="text-2xl font-bold mt-1">{pct}%</p>
              <p className="text-xs text-white/60 mt-0.5">
                {totalDone} de {totalItems} itens vistoriados
              </p>
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
            {roomsData.filter(r => r.doneCount < r.itemsCount).length}
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
      <ul className="px-5 mt-4 flex flex-col gap-3">
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
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                  <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.color}`}
                      style={{ width: `${pctRoom}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-secondary">{pctRoom}%</div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {r.doneCount}/{r.itemsCount}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* CTA Footer */}
      <div className="px-5 mt-6 pb-6 select-none">
        <Link
          href={`/field/vistorias/${id}/resumo`}
          className="block text-center text-xs font-bold text-primary py-3 hover:underline"
        >
          Revisar e Finalizar Vistoria →
        </Link>
      </div>
    </PhoneShell>
  );
}
