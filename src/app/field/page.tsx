"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PhoneShell } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { usePreload } from "@/hooks/usePreload";
import { getDB, LocalVistoria } from "@/lib/db/idb";

const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function FieldDashboard() {
  const { data: session } = useSession();
  const { preloadData, loading, error, progress } = usePreload();
  const [vistorias, setVistorias] = useState<LocalVistoria[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load inspections from IndexedDB
  const loadLocalInspections = async () => {
    try {
      const db = await getDB();
      if (db) {
        const list = await db.getAll("vistorias");
        setVistorias(list);
      }
    } catch (err) {
      console.error("Erro ao ler vistorias do IDB:", err);
    } finally {
      setDbLoaded(true);
    }
  };

  useEffect(() => {
    loadLocalInspections();
  }, []);

  // Preload and reload local state
  const handlePreload = async () => {
    await preloadData();
    await loadLocalInspections();
  };

  const name = session?.user?.name || "Vistoriador";

  // Calculate stats
  const totalConcluidas = vistorias.filter(v => v.status === "CONCLUIDA").length;
  const totalAgendadas = vistorias.filter(v => v.status === "AGENDADA" || v.status === "EM_ANDAMENTO").length;

  // Format today's date
  const today = new Date();
  const optionsDay: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const weekDayName = today.toLocaleDateString('pt-BR', optionsDay);
  const dateFormatted = today.toLocaleDateString('pt-BR', optionsDate);

  // Helper to construct dates for the weekly bar
  const getWeekDates = () => {
    const dates = [];
    const current = new Date();
    // Get Monday of current week
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0-based from Monday

  return (
    <PhoneShell showNav={true}>
      {/* Header */}
      <header className="px-5 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Bom dia,</p>
            <h1 className="text-2xl font-bold text-secondary truncate max-w-[250px]">{name}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/field/vistorias/nova"
              title="Criar nova vistoria"
              className="relative h-11 w-11 rounded-full bg-primary flex items-center justify-center shadow-sm hover:bg-[#009acd] transition-colors"
            >
              <Icon name="add" className="text-[22px] text-white" />
            </Link>
            <button
              onClick={handlePreload}
              disabled={loading}
              title="Sincronizar dados do dia"
              className="relative h-11 w-11 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Icon name="cloud_download" className={`text-[22px] text-primary ${loading ? "animate-bounce" : ""}`} />
            </button>
            <button
              aria-label="Notificações"
              className="relative h-11 w-11 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm"
            >
              <Icon name="notifications" className="text-[22px] text-secondary" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-status-bad" />
            </button>
          </div>
        </div>
      </header>

      {/* Preloader Overlay/Progress */}
      {loading && (
        <div className="mx-5 mb-6 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm text-center space-y-3">
          <p className="text-xs font-semibold text-secondary">Preparando base local offline...</p>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-slate-400">{progress}% completo</span>
        </div>
      )}

      {error && (
        <div className="mx-5 mb-6 bg-status-bad/10 border border-status-bad/20 p-4 rounded-3xl text-center">
          <p className="text-xs font-semibold text-status-bad">Falha na sincronização inicial</p>
          <p className="text-[10px] text-slate-500 mt-1">{error}</p>
          <button
            onClick={handlePreload}
            className="mt-2 text-xs font-bold text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty State / Preload CTA */}
      {dbLoaded && vistorias.length === 0 && !loading && (
        <div className="mx-5 my-8 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <Icon name="cloud_download" className="text-[32px]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-secondary">Sem dados locais</h3>
            <p className="text-xs text-slate-400">
              Você precisa carregar as vistorias do dia antes de ir a campo.
            </p>
          </div>
          <button
            onClick={handlePreload}
            className="w-full h-12 rounded-full bg-primary hover:bg-[#009acd] text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all"
          >
            Baixar Vistorias do Dia
          </button>
        </div>
      )}

      {/* Main Dashboard Content */}
      {vistorias.length > 0 && (
        <>
          {/* Weekly Calendar Card */}
          <section className="mx-5 rounded-3xl bg-secondary text-white p-5 shadow-lg shadow-secondary/20 select-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60 capitalize">{weekDayName}</p>
                <p className="text-xl font-bold">{dateFormatted}</p>
              </div>
              <Icon name="calendar_month" className="text-[26px] text-brand-accent" />
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => {
                const date = weekDates[i];
                const isToday = i === currentDayIndex;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] text-white/50 font-medium">{d}</span>
                    <div
                      className={`h-9 w-9 flex items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-primary text-white" : "text-white/90"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    {/* Visual dot if there is an inspection scheduled on this day */}
                    {date.getDate() === today.getDate() && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stats Section */}
          <section className="px-5 mt-6">
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Esta semana
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
                <Icon name="task_alt" className="text-[20px] text-status-good" />
                <div className="text-xl font-bold text-secondary leading-tight">{totalConcluidas}</div>
                <div className="text-[10px] text-slate-400 font-medium">Concluídas</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
                <Icon name="event" className="text-[20px] text-primary" />
                <div className="text-xl font-bold text-secondary leading-tight">{totalAgendadas}</div>
                <div className="text-[10px] text-slate-400 font-medium">Agendadas</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
                <Icon name="schedule" className="text-[20px] text-brand-accent" />
                <div className="text-xl font-bold text-secondary leading-tight">1h 45</div>
                <div className="text-[10px] text-slate-400 font-medium">Média por vistoria</div>
              </div>
            </div>
          </section>

          {/* Today's Inspections List */}
          <section className="px-5 mt-8 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-secondary">Hoje</h2>
              <span className="text-xs font-semibold text-primary">{vistorias.length} vistorias</span>
            </div>
            <ul className="flex flex-col gap-3">
              {vistorias.map((v) => {
                const dateObj = new Date(v.data);
                const timeStr = dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                
                // Color badges based on state
                let badgeClass = "bg-primary/10 text-primary";
                let statusLabel = "Vistoria";
                if (v.tipo === "ENTRADA") {
                  badgeClass = "bg-status-good/10 text-status-good";
                  statusLabel = "Entrada";
                } else if (v.tipo === "SAIDA") {
                  badgeClass = "bg-status-warn/10 text-status-warn";
                  statusLabel = "Saída";
                }

                return (
                  <li key={v.id}>
                    <Link
                      href={`/field/vistorias/${v.id}`}
                      className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl p-4 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col items-center justify-center min-w-[52px] py-2 px-2 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {timeStr.split(":")[0]}h
                        </span>
                        <span className="text-sm font-bold text-secondary">
                          {timeStr.split(":")[1]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary truncate">
                          {v.imovel.endereco}, {v.imovel.numero}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {v.imovel.bairro} · {v.imovel.cidade}
                        </p>
                        <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <Icon name="chevron_right" className="text-[22px] text-slate-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </PhoneShell>
  );
}
