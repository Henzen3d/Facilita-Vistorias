"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Progress } from "@/components/ui/progress";
import {
  getDB,
  LocalChecklistChegada,
  LocalMidia,
} from "@/lib/db/idb";
import {
  computeCompletionScore,
  type CompletionScore,
} from "@/lib/field/completionScore";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FieldVistoriaSummary({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [midias, setMidias] = useState<LocalMidia[]>([]);
  const [checklist, setChecklist] = useState<LocalChecklistChegada | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [score, setScore] = useState<CompletionScore | null>(null);

  const loadData = async () => {
    try {
      const db = await getDB();
      if (db) {
        const allAmbientes = await db.getAll("ambientes");
        const filteredAmbientes = allAmbientes.filter(
          (a) => a.vistoriaId === id,
        );

        const allItems = await db.getAll("items");
        const ambIds = filteredAmbientes.map((a) => a.id);
        const filteredItems = allItems.filter((i) =>
          ambIds.includes(i.ambienteId),
        );

        const allMidias = await db.getAll("midias");
        const itemIds = filteredItems.map((i) => i.id);
        const filteredMidias = allMidias.filter((m) =>
          itemIds.includes(m.itemId),
        );
        setMidias(filteredMidias);

        const checklists = await db.getAll("checklistChegada");
        const localChecklist =
          checklists.find((c) => c.vistoriaId === id) || null;
        setChecklist(localChecklist);

        setScore(
          computeCompletionScore({
            vistoriaId: id,
            checklist: localChecklist,
            ambientes: filteredAmbientes,
            items: filteredItems,
            midias: filteredMidias,
          }),
        );
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

  const handleFinalize = async () => {
    if (!score?.canFinalize) return;
    setFinalizing(true);
    try {
      const db = await getDB();
      if (db) {
        // Re-check gate from latest IDB (D-05)
        const allAmbientes = (await db.getAll("ambientes")).filter(
          (a) => a.vistoriaId === id,
        );
        const ambIds = new Set(allAmbientes.map((a) => a.id));
        const allItems = (await db.getAll("items")).filter((i) =>
          ambIds.has(i.ambienteId),
        );
        const allMidias = await db.getAll("midias");
        const fresh = computeCompletionScore({
          vistoriaId: id,
          checklist,
          ambientes: allAmbientes,
          items: allItems,
          midias: allMidias,
        });
        if (!fresh.canFinalize) {
          setScore(fresh);
          setFinalizing(false);
          return;
        }

        const vistoria = await db.get("vistorias", id);
        if (vistoria) {
          vistoria.status = "EM_REVISAO";
          await db.put("vistorias", vistoria);
        }

        await db.put("mutation_queue", {
          action: "UPDATE_VISTORIA_STATUS",
          vistoriaId: id,
          payload: { status: "EM_REVISAO" },
          timestamp: Date.now(),
        });

        router.push(`/field/vistorias/${id}/sucesso`);
      }
    } catch (err) {
      console.error("Erro ao finalizar vistoria:", err);
    } finally {
      setFinalizing(false);
    }
  };

  if (loading || !score) {
    return (
      <PhoneShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <Icon
            name="progress_activity"
            className="text-3xl text-primary animate-spin"
          />
        </div>
      </PhoneShell>
    );
  }

  const { stats, issues, percent, canFinalize } = score;
  const visibleIssues = issues.slice(0, 8);
  const extraIssues = issues.length - visibleIssues.length;

  const blockers = issues.filter((i) => i.severity === "blocker");
  const photoBlock = blockers.some((i) => i.id === "missing-photos");
  const pendingBlock = blockers.some((i) => i.id === "pending-items");

  return (
    <PhoneShell showNav={false}>
      <TopBar
        title="Resumo da Vistoria"
        backTo={`/field/vistorias/${id}/ambientes`}
      />

      <main className="flex-1 px-5 pt-2 pb-6 space-y-5 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Completude */}
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                Completude
              </h3>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  canFinalize ? "text-status-good" : "text-secondary",
                )}
              >
                {percent}%
              </span>
            </div>
            <Progress
              value={percent}
              size="md"
              barClassName={canFinalize ? "bg-status-good" : "bg-primary"}
              label="Pronto para enviar à revisão"
              meta={`${stats.itemsDone}/${stats.itemsTotal} itens · ${stats.itemsTotal - stats.itemsWithoutPhoto}/${stats.itemsTotal} com foto`}
            />
          </div>

          {/* Stats card */}
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
              Status de execução
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Ambientes:</span>
                <span className="font-bold text-secondary">
                  {stats.ambientes} cômodos
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">
                  Itens vistoriados:
                </span>
                <span className="font-bold text-secondary">
                  {stats.itemsDone} de {stats.itemsTotal}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">
                  Itens com foto:
                </span>
                <span
                  className={cn(
                    "font-bold",
                    stats.itemsWithoutPhoto === 0 && stats.itemsTotal > 0
                      ? "text-status-good"
                      : "text-status-bad",
                  )}
                >
                  {stats.itemsTotal - stats.itemsWithoutPhoto} de{" "}
                  {stats.itemsTotal}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Mídias:</span>
                <span className="font-bold text-secondary">
                  {midias.length} ({midias.filter((m) => m.tipo === "FOTO").length}{" "}
                  fotos, {midias.filter((m) => m.tipo === "AUDIO").length} áudios)
                </span>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-3">
                <span className="text-slate-500 font-medium">Sincronização:</span>
                {stats.midiasPendingSync === 0 ? (
                  <span className="text-status-good font-bold flex items-center gap-1">
                    <Icon name="check_circle" className="text-[16px]" />
                    Em dia
                  </span>
                ) : (
                  <span className="text-status-warn font-bold flex items-center gap-1">
                    <Icon name="error" className="text-[16px]" />
                    {stats.midiasPendingSync} pendentes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actionable issues */}
          {issues.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  O que falta
                </h3>
              </div>
              <ul className="divide-y divide-slate-50">
                {visibleIssues.map((issue) => {
                  const tone =
                    issue.severity === "blocker"
                      ? "text-status-bad"
                      : issue.severity === "warn"
                        ? "text-status-warn"
                        : "text-slate-500";
                  const icon =
                    issue.severity === "blocker"
                      ? "error"
                      : issue.severity === "warn"
                        ? "warning"
                        : "info";
                  return (
                    <li key={issue.id}>
                      <Link
                        href={issue.href}
                        className="flex items-center gap-3 px-4 py-3 min-h-[52px] hover:bg-slate-50 active:bg-slate-100 transition-colors"
                      >
                        <Icon
                          name={icon}
                          className={cn("text-[20px] shrink-0", tone)}
                        />
                        <span className="flex-1 text-sm font-semibold text-secondary leading-snug">
                          {issue.label}
                        </span>
                        <Icon
                          name="chevron_right"
                          className="text-slate-300 text-[20px] shrink-0"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {extraIssues > 0 && (
                <p className="px-5 py-2 text-xs text-slate-400 font-medium">
                  e mais {extraIssues} pendência{extraIssues > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center space-y-3">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Icon name="assignment_turned_in" className="text-[26px]" />
            </div>
            <h3 className="font-bold text-sm text-secondary">
              {canFinalize
                ? "Tudo pronto para finalizar?"
                : "Ainda há pendências"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Ao finalizar, a captura em campo entra em revisão (EM_REVISAO).
              Depois você revisa as descrições técnicas online. Todo item precisa
              de ao menos 1 foto no relatório fotográfico.
            </p>
          </div>

          <Link
            href={`/field/vistorias/${id}/revisao-ia`}
            className="block w-full text-center text-primary text-xs font-bold hover:underline py-1"
          >
            Revisar descrições (online)
          </Link>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-background-light via-background-light to-background-light/0 pt-6">
          <button
            onClick={handleFinalize}
            disabled={finalizing || !canFinalize}
            className="w-full h-16 rounded-full bg-primary hover:bg-[#009acd] text-white text-base font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {finalizing ? (
              <>
                <Icon
                  name="progress_activity"
                  className="text-[22px] animate-spin"
                />
                Finalizando...
              </>
            ) : (
              <>
                Finalizar Vistoria
                <Icon name="check" className="text-[22px]" />
              </>
            )}
          </button>

          {!canFinalize && (
            <p className="text-center text-[10px] text-slate-500 mt-2 select-none px-2 leading-relaxed">
              {photoBlock
                ? "Todo item precisa de ao menos 1 foto para constar no relatório."
                : pendingBlock
                  ? "Responda todos os itens (estado + foto) antes de finalizar."
                  : stats.ambientes === 0
                    ? "Adicione cômodos ou aplique um modelo antes de finalizar."
                    : "Resolva as pendências acima para finalizar."}
            </p>
          )}
        </div>
      </main>
    </PhoneShell>
  );
}
