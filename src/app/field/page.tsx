"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PhoneShell } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePreload } from "@/hooks/usePreload";
import { getDB, LocalVistoria } from "@/lib/db/idb";

const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];

type VistoriaCard = LocalVistoria & {
  progressPct: number;
  itemsDone: number;
  itemsTotal: number;
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function tipoBadge(tipo: LocalVistoria["tipo"]): { tone: "good" | "fair" | "primary" | "pending"; label: string } {
  if (tipo === "ENTRADA") return { tone: "good", label: "Entrada" };
  if (tipo === "SAIDA") return { tone: "fair", label: "Saída" };
  if (tipo === "CONTRA_VISTORIA") return { tone: "primary", label: "Contra-vistoria" };
  return { tone: "pending", label: "Vistoria" };
}

function statusProgressHint(status: LocalVistoria["status"], itemsPct: number) {
  if (status === "CONCLUIDA" || status === "EM_REVISAO") return 100;
  if (itemsPct > 0) return itemsPct;
  if (status === "EM_ANDAMENTO") return 15;
  return 0;
}

export default function FieldDashboard() {
  const { data: session } = useSession();
  const { preloadData, loading, error, progress } = usePreload();
  const [vistorias, setVistorias] = useState<VistoriaCard[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  const loadLocalInspections = async () => {
    try {
      const db = await getDB();
      if (db) {
        const list = await db.getAll("vistorias");
        const ambientes = await db.getAll("ambientes");
        const items = await db.getAll("items");

        const enriched: VistoriaCard[] = list.map((v) => {
          const ambIds = new Set(
            ambientes.filter((a) => a.vistoriaId === v.id).map((a) => a.id),
          );
          const vistoriaItems = items.filter((i) => ambIds.has(i.ambienteId));
          const itemsDone = vistoriaItems.filter((i) => i.status !== "PENDENTE").length;
          const itemsTotal = vistoriaItems.length;
          const itemsPct =
            itemsTotal > 0 ? Math.round((itemsDone / itemsTotal) * 100) : 0;
          return {
            ...v,
            itemsDone,
            itemsTotal,
            progressPct: statusProgressHint(v.status, itemsPct),
          };
        });

        // Sort: in-progress first, then by date
        enriched.sort((a, b) => {
          const rank = (s: string) =>
            s === "EM_ANDAMENTO" ? 0 : s === "AGENDADA" ? 1 : 2;
          const r = rank(a.status) - rank(b.status);
          if (r !== 0) return r;
          return new Date(a.data).getTime() - new Date(b.data).getTime();
        });

        setVistorias(enriched);
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

  const handlePreload = async () => {
    await preloadData();
    await loadLocalInspections();
  };

  const name = session?.user?.name || "Vistoriador";
  const firstName = name.split(" ")[0];

  const totalConcluidas = vistorias.filter(
    (v) => v.status === "CONCLUIDA" || v.status === "EM_REVISAO",
  ).length;
  const totalAgendadas = vistorias.filter(
    (v) => v.status === "AGENDADA" || v.status === "EM_ANDAMENTO",
  ).length;

  const today = new Date();
  const hour = today.getHours();
  const greeting = greetingForHour(hour);
  const weekDayName = today.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = today.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });

  const getWeekDates = () => {
    const dates: Date[] = [];
    const current = new Date();
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
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const hasInspectionOnDay = (date: Date) => {
    return vistorias.some((v) => {
      const vd = new Date(v.data);
      return (
        vd.getDate() === date.getDate() &&
        vd.getMonth() === date.getMonth() &&
        vd.getFullYear() === date.getFullYear()
      );
    });
  };

  const nextOpen = vistorias.find(
    (v) => v.status === "EM_ANDAMENTO" || v.status === "AGENDADA",
  );

  return (
    <PhoneShell showNav={true}>
      <header className="px-5 pt-4 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{greeting},</p>
            <h1 className="text-2xl font-bold text-secondary truncate max-w-[240px]">
              {firstName}
            </h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/field/vistorias/nova"
              title="Criar nova vistoria"
              aria-label="Nova vistoria"
              className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-primary flex items-center justify-center shadow-soft hover:bg-primary-hover transition-colors active:scale-95"
            >
              <Icon name="add" className="text-[22px] text-white" />
            </Link>
            <button
              type="button"
              onClick={handlePreload}
              disabled={loading}
              title="Sincronizar dados do dia"
              aria-label="Baixar vistorias"
              className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 active:scale-95"
            >
              <Icon
                name="cloud_download"
                className={`text-[22px] text-primary ${loading ? "animate-pulse" : ""}`}
              />
            </button>
            <button
              type="button"
              aria-label="Notificações"
              className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm active:scale-95"
            >
              <Icon name="notifications" className="text-[22px] text-secondary" />
              {totalAgendadas > 0 && (
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-status-bad" />
              )}
            </button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="mx-5 mb-5 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="cloud_sync" className="text-primary text-[20px] animate-pulse" />
            <p className="text-sm font-semibold text-secondary">
              Preparando base local offline…
            </p>
          </div>
          <Progress value={progress} meta={`${progress}%`} />
        </div>
      )}

      {error && (
        <div className="mx-5 mb-5 bg-red-50 border border-red-100 p-4 rounded-3xl text-center space-y-2">
          <p className="text-sm font-semibold text-red-700">Falha na sincronização inicial</p>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={handlePreload}
            className="mt-1 text-sm font-bold text-primary hover:underline min-h-[44px] px-3"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {dbLoaded && vistorias.length === 0 && !loading && (
        <div className="mx-5 my-6 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm text-center space-y-5">
          <div className="h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto">
            <Icon name="cloud_download" className="text-[40px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-secondary">Sem dados locais</h3>
            <p className="text-sm text-slate-500 max-w-[28ch] mx-auto">
              Baixe as vistorias do dia ou crie uma vistoria do zero antes de ir a campo.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handlePreload} fullWidth size="lg">
              <Icon name="cloud_download" className="text-[22px]" />
              Baixar vistorias do dia
            </Button>
            <Link
              href="/field/vistorias/nova"
              className="inline-flex items-center justify-center w-full h-12 min-h-[48px] rounded-full border border-slate-200 bg-white text-secondary text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              <Icon name="add_circle" className="text-[20px] mr-2 text-primary" />
              Nova vistoria offline
            </Link>
          </div>
        </div>
      )}

      {vistorias.length > 0 && (
        <>
          <section className="mx-5 rounded-3xl bg-secondary text-white p-5 shadow-lg shadow-secondary/20 select-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60 capitalize">
                  {weekDayName}
                </p>
                <p className="text-xl font-bold">{dateFormatted}</p>
              </div>
              <span className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center">
                <Icon name="calendar_month" className="text-[24px] text-accent" />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => {
                const date = weekDates[i];
                const isToday = i === currentDayIndex;
                const hasDot = hasInspectionOnDay(date);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] text-white/50 font-medium">{d}</span>
                    <div
                      className={`h-9 w-9 flex items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-primary text-white shadow-soft" : "text-white/90"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        hasDot ? "bg-accent" : "bg-transparent"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {nextOpen && (
            <div className="px-5 mt-5">
              <Link
                href={`/field/vistorias/${nextOpen.id}`}
                className="flex items-center gap-3 w-full min-h-[56px] rounded-full bg-primary hover:bg-primary-hover text-white px-5 py-3 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                <Icon name="play_circle" filled className="text-[28px] shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold leading-tight">
                    {nextOpen.status === "EM_ANDAMENTO"
                      ? "Continuar vistoria"
                      : "Iniciar próxima"}
                  </p>
                  <p className="text-xs text-white/80 truncate">
                    {nextOpen.imovel.endereco}, {nextOpen.imovel.numero}
                  </p>
                </div>
                <Icon name="chevron_right" className="text-[22px] shrink-0" />
              </Link>
            </div>
          )}

          <section className="px-5 mt-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Resumo local
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-100 rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-sm">
                <Icon name="task_alt" className="text-[22px] text-status-good" />
                <div className="text-xl font-bold text-secondary leading-tight tabular-nums">
                  {totalConcluidas}
                </div>
                <div className="text-xs text-slate-500 font-medium">Concluídas</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-sm">
                <Icon name="event" className="text-[22px] text-primary" />
                <div className="text-xl font-bold text-secondary leading-tight tabular-nums">
                  {totalAgendadas}
                </div>
                <div className="text-xs text-slate-500 font-medium">Em aberto</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-sm">
                <Icon name="inventory_2" className="text-[22px] text-accent" />
                <div className="text-xl font-bold text-secondary leading-tight tabular-nums">
                  {vistorias.length}
                </div>
                <div className="text-xs text-slate-500 font-medium">No aparelho</div>
              </div>
            </div>
          </section>

          <section className="px-5 mt-8 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-secondary">Vistorias</h2>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {vistorias.length}
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {vistorias.map((v) => {
                const dateObj = new Date(v.data);
                const timeStr = dateObj.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const badge = tipoBadge(v.tipo);
                const barTone =
                  v.progressPct >= 100
                    ? "bg-status-good"
                    : v.progressPct > 0
                      ? "bg-primary"
                      : "bg-slate-300";

                return (
                  <li key={v.id}>
                    <Link
                      href={`/field/vistorias/${v.id}`}
                      className="block bg-white border border-slate-100 rounded-3xl p-4 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center min-w-[52px] min-h-[52px] py-2 px-2 rounded-2xl bg-slate-50 border border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {timeStr.split(":")[0]}h
                          </span>
                          <span className="text-sm font-bold text-secondary tabular-nums">
                            {timeStr.split(":")[1]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-secondary truncate">
                            {v.imovel.endereco}, {v.imovel.numero}
                          </p>
                          <p className="text-sm text-slate-500 truncate mt-0.5">
                            {v.imovel.bairro} · {v.imovel.cidade}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge tone={badge.tone}>{badge.label}</Badge>
                            {v.status === "EM_ANDAMENTO" && (
                              <Badge tone="primary">Em andamento</Badge>
                            )}
                          </div>
                        </div>
                        <Icon name="chevron_right" className="text-[22px] text-slate-400 shrink-0" />
                      </div>
                      <div className="mt-3 pl-[68px]">
                        <Progress
                          value={v.progressPct}
                          size="sm"
                          barClassName={barTone}
                          meta={
                            v.itemsTotal > 0
                              ? `${v.itemsDone}/${v.itemsTotal} · ${v.progressPct}%`
                              : `${v.progressPct}%`
                          }
                        />
                      </div>
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
