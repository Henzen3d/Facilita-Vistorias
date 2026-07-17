import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface LocalVistoria {
  id: string;
  codigo: string;
  tipo: "ENTRADA" | "SAIDA" | "CONTRA_VISTORIA";
  data: string;
  status:
    | "AGENDADA"
    | "EM_ANDAMENTO"
    | "EM_REVISAO"
    | "CONCLUIDA"
    | "FINALIZADA"
    | "CANCELADA";
  imovelId: string;
  empresaId: string;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
  imovel: {
    id: string;
    endereco: string;
    numero: string | null;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pessoas: Array<{
      id: string;
      nome: string;
      email: string | null;
      telefone: string | null;
      tipo: "LOCADOR" | "LOCATARIO";
    }>;
  };
}

export interface LocalAmbiente {
  id: string;
  nome: string;
  ordem: number;
  vistoriaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalItem {
  id: string;
  nome: string;
  descricao: string | null;
  descricaoFinal: string | null;
  descricaoEditada: boolean;
  status: "BOM" | "REGULAR" | "RUIM" | "PENDENTE"; // StatusItem enums
  ambienteId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMidia {
  id: string;
  tipo: "FOTO" | "AUDIO";
  url: string; // Blob URL or local file path or remote URL
  key: string;  // Unique ID of the file
  itemId: string;
  uploadedAt: string;
  syncStatus: "PENDENTE" | "SYNCED" | "ERROR";
  // The actual raw file blob for offline uploading
  blob?: Blob;
}

export interface LocalChecklistChegada {
  id: string;
  vistoriaId: string;
  cheiroGasOk: boolean;
  luzesLigadas: boolean;
  janelasAbertas: boolean;
  arCondicionadoLigado: boolean;
  aguaQuenteLigada: boolean;
  descargasTestadas: boolean;
  chuveirosTestados: boolean;
  disjuntoresChecados: boolean;
  interfoneTestado: boolean;
  portaoGaragemTestado: boolean;
  outrosItens: any | null;
}

/** Utility meter readings captured at end of field visit (Phase 3.2). */
export interface LocalMedidores {
  id: string;
  vistoriaId: string;
  aguaNumero: string | null;
  aguaLeitura: string | null;
  energiaNumero: string | null;
  energiaLeitura: string | null;
  gasNumero: string | null;
  gasLeitura: string | null;
  observacoes: string | null;
  updatedAt: string;
}

export function emptyLocalMedidores(vistoriaId: string): LocalMedidores {
  return {
    id: `med-${vistoriaId}`,
    vistoriaId,
    aguaNumero: null,
    aguaLeitura: null,
    energiaNumero: null,
    energiaLeitura: null,
    gasNumero: null,
    gasLeitura: null,
    observacoes: null,
    updatedAt: new Date().toISOString(),
  };
}

export interface MutationQueueItem {
  id?: number; // Auto-increment key in IndexedDB
  action:
    | "CREATE_MIDIA"
    | "DELETE_MIDIA"
    | "UPDATE_ITEM_STATUS"
    | "UPDATE_CHECKLIST"
    | "UPDATE_MEDIDORES"
    | "UPDATE_VISTORIA_STATUS"
    | "FINALIZAR_CAMPO"
    | "CREATE_VISTORIA_LOCAL"
    | "CREATE_AMBIENTE_LOCAL"
    | "CREATE_ITEM_LOCAL";
  vistoriaId: string;
  payload: any;
  timestamp: number;
}

interface FacilitaVistoriasSchema extends DBSchema {
  vistorias: {
    key: string;
    value: LocalVistoria;
  };
  ambientes: {
    key: string;
    value: LocalAmbiente;
    indexes: { "by-vistoria": string };
  };
  items: {
    key: string;
    value: LocalItem;
    indexes: { "by-ambiente": string };
  };
  midias: {
    key: string;
    value: LocalMidia;
    indexes: { "by-item": string };
  };
  checklistChegada: {
    key: string;
    value: LocalChecklistChegada;
    indexes: { "by-vistoria": string };
  };
  medidores: {
    key: string;
    value: LocalMedidores;
    indexes: { "by-vistoria": string };
  };
  mutation_queue: {
    key: number;
    value: MutationQueueItem;
  };
}

const DB_NAME = "facilita_vistorias_db";
/** v2: medidores store (Phase 3.2) */
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<FacilitaVistoriasSchema>> | null = null;

export function getDB() {
  if (typeof window === "undefined") return null; // Safe for SSR / Next.js server components

  if (!dbPromise) {
    dbPromise = openDB<FacilitaVistoriasSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // vistorias store
        if (!db.objectStoreNames.contains("vistorias")) {
          db.createObjectStore("vistorias", { keyPath: "id" });
        }

        // ambientes store
        if (!db.objectStoreNames.contains("ambientes")) {
          const store = db.createObjectStore("ambientes", { keyPath: "id" });
          store.createIndex("by-vistoria", "vistoriaId");
        }

        // items store
        if (!db.objectStoreNames.contains("items")) {
          const store = db.createObjectStore("items", { keyPath: "id" });
          store.createIndex("by-ambiente", "ambienteId");
        }

        // midias store
        if (!db.objectStoreNames.contains("midias")) {
          const store = db.createObjectStore("midias", { keyPath: "id" });
          store.createIndex("by-item", "itemId");
        }

        // checklistChegada store
        if (!db.objectStoreNames.contains("checklistChegada")) {
          const store = db.createObjectStore("checklistChegada", { keyPath: "id" });
          store.createIndex("by-vistoria", "vistoriaId");
        }

        // mutation_queue store
        if (!db.objectStoreNames.contains("mutation_queue")) {
          db.createObjectStore("mutation_queue", { keyPath: "id", autoIncrement: true });
        }

        // v2 — medidores
        if (oldVersion < 2 && !db.objectStoreNames.contains("medidores")) {
          const store = db.createObjectStore("medidores", { keyPath: "id" });
          store.createIndex("by-vistoria", "vistoriaId");
        }
      },
    });
  }

  return dbPromise;
}
