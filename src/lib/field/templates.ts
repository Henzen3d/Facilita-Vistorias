/**
 * Static property / room templates for field capture (offline-first).
 * Phase 3.1 — no admin CRUD.
 */

export type RoomTemplate = {
  nome: string;
  itens: string[];
};

export type PropertyTemplate = {
  id: string;
  label: string;
  description: string;
  rooms: RoomTemplate[];
};

const ITEMS_QUARTO = [
  "Piso",
  "Paredes",
  "Teto",
  "Porta",
  "Janela",
  "Tomadas e interruptores",
  "Iluminação",
];

const ITEMS_SALA = [
  "Piso",
  "Paredes",
  "Teto",
  "Porta",
  "Janela",
  "Tomadas e interruptores",
  "Iluminação",
];

const ITEMS_COZINHA = [
  "Piso",
  "Paredes",
  "Teto",
  "Bancada",
  "Pia",
  "Armários",
  "Torneira",
  "Tomadas e interruptores",
  "Iluminação",
];

const ITEMS_BANHEIRO = [
  "Piso",
  "Paredes",
  "Teto",
  "Porta",
  "Box / espelho",
  "Vaso sanitário",
  "Pia",
  "Torneira",
  "Chuveiro",
  "Iluminação",
];

const ITEMS_SERVICO = [
  "Piso",
  "Paredes",
  "Tanque",
  "Torneira",
  "Tomadas",
];

const ITEMS_SACADA = ["Piso", "Guarda-corpo", "Iluminação"];

const ITEMS_GARAGEM = ["Piso", "Portão", "Iluminação"];

const ITEMS_DEFAULT = ["Piso", "Paredes", "Teto", "Porta", "Iluminação"];

/** Default checklist items for a room name (used when adding a room ad-hoc). */
export function defaultItemsForRoomName(nome: string): string[] {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    n.includes("quarto") ||
    n.includes("dormitorio") ||
    n.includes("suite")
  ) {
    return [...ITEMS_QUARTO];
  }
  if (n.includes("sala") || n.includes("estar") || n.includes("living")) {
    return [...ITEMS_SALA];
  }
  if (n.includes("cozinha") || n.includes("copa")) {
    return [...ITEMS_COZINHA];
  }
  if (n.includes("banheiro") || n.includes("lavabo") || n.includes("wc")) {
    return [...ITEMS_BANHEIRO];
  }
  if (
    n.includes("servico") ||
    n.includes("lavanderia") ||
    n.includes("area de servico")
  ) {
    return [...ITEMS_SERVICO];
  }
  if (
    n.includes("sacada") ||
    n.includes("varanda") ||
    n.includes("terraco") ||
    n.includes("balcao")
  ) {
    return [...ITEMS_SACADA];
  }
  if (
    n.includes("garagem") ||
    n.includes("externa") ||
    n.includes("quintal") ||
    n.includes("jardim")
  ) {
    return [...ITEMS_GARAGEM];
  }
  return [...ITEMS_DEFAULT];
}

function room(nome: string, itens?: string[]): RoomTemplate {
  return { nome, itens: itens ?? defaultItemsForRoomName(nome) };
}

export const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  {
    id: "studio",
    label: "Studio / kitnet",
    description: "Ambiente integrado + banheiro + cozinha",
    rooms: [
      room("Sala / quarto integrado", [
        ...ITEMS_SALA,
        "Área de dormir",
      ]),
      room("Cozinha"),
      room("Banheiro"),
      room("Área de serviço"),
    ],
  },
  {
    id: "apto-1",
    label: "Apto 1 quarto",
    description: "Sala, cozinha, banheiro, quarto e serviço",
    rooms: [
      room("Sala"),
      room("Cozinha"),
      room("Banheiro"),
      room("Quarto 1"),
      room("Área de serviço"),
      room("Sacada"),
    ],
  },
  {
    id: "apto-2",
    label: "Apto 2 quartos",
    description: "Dois dormitórios + áreas comuns",
    rooms: [
      room("Sala"),
      room("Cozinha"),
      room("Banheiro social"),
      room("Quarto 1"),
      room("Quarto 2"),
      room("Área de serviço"),
      room("Sacada"),
    ],
  },
  {
    id: "apto-3",
    label: "Apto 3 quartos",
    description: "Três dormitórios + áreas comuns",
    rooms: [
      room("Sala"),
      room("Cozinha"),
      room("Banheiro social"),
      room("Banheiro suíte"),
      room("Quarto 1"),
      room("Quarto 2"),
      room("Quarto 3"),
      room("Área de serviço"),
      room("Sacada"),
    ],
  },
  {
    id: "casa",
    label: "Casa",
    description: "Layout residencial com área externa",
    rooms: [
      room("Sala"),
      room("Cozinha"),
      room("Banheiro social"),
      room("Banheiro suíte"),
      room("Quarto 1"),
      room("Quarto 2"),
      room("Quarto 3"),
      room("Área de serviço"),
      room("Área externa / quintal"),
      room("Garagem"),
    ],
  },
];

export function getPropertyTemplate(id: string): PropertyTemplate | undefined {
  return PROPERTY_TEMPLATES.find((t) => t.id === id);
}
