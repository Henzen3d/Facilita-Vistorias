import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface LocalVistoria {
  id: string;
  codigo: string;
  tipo: "ENTRADA" | "SAIDA" | "CONTRA_VISTORIA";
  data: string;
  status: "AGENDADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
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

export interface MutationQueueItem {
  id?: number; // Auto-increment key in IndexedDB
  action: "CREATE_MIDIA" | "DELETE_MIDIA" | "UPDATE_ITEM_STATUS" | "UPDATE_CHECKLIST";
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
  mutation_queue: {
    key: number;
    value: MutationQueueItem;
  };
}

const DB_NAME = "facilita_vistorias_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FacilitaVistoriasSchema>> | null = null;

export function getDB() {
  if (typeof window === "undefined") return null; // Safe for SSR / Next.js server components

  if (!dbPromise) {
    dbPromise = openDB<FacilitaVistoriasSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
      },
    });
  }

  return dbPromise;
}
