import type {
  LocalAmbiente,
  LocalChecklistChegada,
  LocalItem,
  LocalMidia,
} from "@/lib/db/idb";
import { buildItemPath } from "@/lib/field/itemNavigation";

export type CompletionIssue = {
  id: string;
  severity: "blocker" | "warn" | "info";
  label: string;
  href: string;
};

export type CompletionScore = {
  percent: number;
  canFinalize: boolean;
  issues: CompletionIssue[];
  stats: {
    ambientes: number;
    itemsTotal: number;
    itemsDone: number;
    itemsPending: number;
    itemsWithoutPhoto: number;
    itemsWithoutAudio: number;
    checklistDone: number;
    checklistTotal: number;
    midiasPendingSync: number;
  };
};

const CHECKLIST_KEYS: (keyof Omit<
  LocalChecklistChegada,
  "id" | "vistoriaId" | "outrosItens"
>)[] = [
  "cheiroGasOk",
  "luzesLigadas",
  "janelasAbertas",
  "arCondicionadoLigado",
  "aguaQuenteLigada",
  "descargasTestadas",
  "chuveirosTestados",
  "disjuntoresChecados",
  "interfoneTestado",
  "portaoGaragemTestado",
];

export function computeCompletionScore(input: {
  vistoriaId: string;
  checklist: LocalChecklistChegada | null;
  ambientes: LocalAmbiente[];
  items: LocalItem[];
  midias: LocalMidia[];
}): CompletionScore {
  const { vistoriaId, checklist, ambientes, items, midias } = input;
  const ambientesSorted = [...ambientes].sort((a, b) => a.ordem - b.ordem);
  const ambIds = new Set(ambientesSorted.map((a) => a.id));
  const vistoriaItems = items.filter((i) => ambIds.has(i.ambienteId));

  const itemsTotal = vistoriaItems.length;
  const itemsDone = vistoriaItems.filter((i) => i.status !== "PENDENTE").length;
  const itemsPending = itemsTotal - itemsDone;

  const fotoByItem = new Map<string, number>();
  const audioByItem = new Map<string, number>();
  let midiasPendingSync = 0;

  for (const m of midias) {
    if (!vistoriaItems.some((i) => i.id === m.itemId)) continue;
    if (m.syncStatus !== "SYNCED") midiasPendingSync += 1;
    if (m.tipo === "FOTO") {
      fotoByItem.set(m.itemId, (fotoByItem.get(m.itemId) ?? 0) + 1);
    } else if (m.tipo === "AUDIO") {
      audioByItem.set(m.itemId, (audioByItem.get(m.itemId) ?? 0) + 1);
    }
  }

  const itemsWithoutPhotoList = vistoriaItems.filter(
    (i) => (fotoByItem.get(i.id) ?? 0) === 0,
  );
  const itemsWithoutPhoto = itemsWithoutPhotoList.length;
  const itemsWithoutAudio = vistoriaItems.filter(
    (i) => (audioByItem.get(i.id) ?? 0) === 0,
  ).length;
  const itemsWithPhoto = itemsTotal - itemsWithoutPhoto;

  const checklistTotal = CHECKLIST_KEYS.length;
  const checklistDone = checklist
    ? CHECKLIST_KEYS.filter((k) => Boolean(checklist[k])).length
    : 0;

  // Weights (D-05 photo-heavy)
  const cadastroPts = ambientesSorted.length >= 1 ? 10 : 0;
  const protocoloPts =
    checklistTotal > 0
      ? Math.round((checklistDone / checklistTotal) * 10)
      : 0;
  const statusPts =
    itemsTotal > 0 ? Math.round((itemsDone / itemsTotal) * 40) : 0;
  const fotoPts =
    itemsTotal > 0 ? Math.round((itemsWithPhoto / itemsTotal) * 40) : 0;
  const percent = Math.min(100, cadastroPts + protocoloPts + statusPts + fotoPts);

  const issues: CompletionIssue[] = [];
  const baseAmb = `/field/vistorias/${vistoriaId}/ambientes`;

  if (ambientesSorted.length === 0) {
    issues.push({
      id: "no-rooms",
      severity: "blocker",
      label: "Adicione cômodos ou aplique um modelo de imóvel",
      href: baseAmb,
    });
  }

  if (itemsTotal === 0 && ambientesSorted.length > 0) {
    issues.push({
      id: "no-items",
      severity: "blocker",
      label: "Nenhum item nos cômodos — adicione itens para capturar",
      href: `${baseAmb}/${ambientesSorted[0].id}`,
    });
  }

  if (itemsPending > 0) {
    const firstPending = vistoriaItems.find((i) => i.status === "PENDENTE");
    const amb =
      firstPending &&
      ambientesSorted.find((a) => a.id === firstPending.ambienteId);
    issues.push({
      id: "pending-items",
      severity: "blocker",
      label: `${itemsPending} item${itemsPending > 1 ? "s" : ""} ainda pendente${itemsPending > 1 ? "s" : ""}`,
      href: firstPending
        ? buildItemPath(vistoriaId, firstPending.ambienteId, firstPending.id)
        : baseAmb,
    });
    void amb;
  }

  if (itemsWithoutPhoto > 0) {
    const first = itemsWithoutPhotoList[0];
    issues.push({
      id: "missing-photos",
      severity: "blocker",
      label: `${itemsWithoutPhoto} item${itemsWithoutPhoto > 1 ? "s" : ""} sem foto (obrigatório no relatório)`,
      href: first
        ? buildItemPath(vistoriaId, first.ambienteId, first.id)
        : baseAmb,
    });
  }

  if (checklistDone < checklistTotal) {
    issues.push({
      id: "checklist",
      severity: "warn",
      label: `Protocolo de chegada incompleto (${checklistDone}/${checklistTotal})`,
      href: baseAmb,
    });
  }

  if (midiasPendingSync > 0) {
    issues.push({
      id: "sync",
      severity: "info",
      label: `${midiasPendingSync} mídia${midiasPendingSync > 1 ? "s" : ""} pendente${midiasPendingSync > 1 ? "s" : ""} de sincronização`,
      href: "/field/sync",
    });
  }

  if (itemsWithoutAudio > 0 && itemsTotal > 0) {
    const firstNoAudio = vistoriaItems.find(
      (i) => (audioByItem.get(i.id) ?? 0) === 0,
    );
    issues.push({
      id: "missing-audio",
      severity: "info",
      label: `${itemsWithoutAudio} item${itemsWithoutAudio > 1 ? "s" : ""} sem áudio (opcional; melhora a IA)`,
      href: firstNoAudio
        ? buildItemPath(vistoriaId, firstNoAudio.ambienteId, firstNoAudio.id)
        : baseAmb,
    });
  }

  const canFinalize =
    ambientesSorted.length >= 1 &&
    itemsTotal >= 1 &&
    itemsPending === 0 &&
    itemsWithoutPhoto === 0;

  return {
    percent,
    canFinalize,
    issues,
    stats: {
      ambientes: ambientesSorted.length,
      itemsTotal,
      itemsDone,
      itemsPending,
      itemsWithoutPhoto,
      itemsWithoutAudio,
      checklistDone,
      checklistTotal,
      midiasPendingSync,
    },
  };
}
