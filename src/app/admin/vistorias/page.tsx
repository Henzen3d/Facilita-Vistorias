import Link from "next/link";
import { Icon } from "@/components/app/Icon";

const rows = [
  {
    id: "1",
    codigo: "VIS-2026-001",
    address: "Rua XV de Novembro, 1234 — Ap 302",
    tipo: "Entrada",
    vistoriador: "Osmar Gonçalves",
    data: "14/07/2026",
    status: "Concluída",
    tone: "good" as const,
    hasReport: true,
  },
  {
    id: "2",
    codigo: "VIS-2026-002",
    address: "Alameda Rio Branco, 45 — Casa 02",
    tipo: "Saída",
    vistoriador: "Osmar Gonçalves",
    data: "15/07/2026",
    status: "Em revisão",
    tone: "fair" as const,
    hasReport: false,
  },
];

export default function AdminVistoriasList() {
  return (
    <div className="min-h-screen bg-background-light font-sans text-secondary p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
            Operações
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Icon name="assignment" className="text-[28px] text-primary" />
            Lista de vistorias
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Filtrar, revisar IA e acompanhar relatórios fotográficos
          </p>
        </div>
        <Link
          href="/admin"
          className="text-primary text-sm hover:underline font-bold min-h-[44px] inline-flex items-center"
        >
          ← Dashboard
        </Link>
      </header>

      <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 mb-6">
        <label className="sr-only" htmlFor="admin-vistorias-search">
          Buscar
        </label>
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"
          />
          <input
            id="admin-vistorias-search"
            type="search"
            placeholder="Buscar endereço, código ou cliente…"
            className="w-full h-11 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
          />
        </div>
        <label className="sr-only" htmlFor="admin-vistorias-status">
          Status
        </label>
        <select
          id="admin-vistorias-status"
          className="h-11 min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-secondary"
          defaultValue="all"
        >
          <option value="all">Todos os status</option>
          <option>Agendada</option>
          <option>Em campo</option>
          <option>Em revisão</option>
          <option>Concluída</option>
          <option>Contestada</option>
        </select>
        <label className="sr-only" htmlFor="admin-vistorias-empresa">
          Empresa
        </label>
        <select
          id="admin-vistorias-empresa"
          className="h-11 min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-secondary"
          defaultValue="all"
        >
          <option value="all">Todas as empresas</option>
        </select>
      </section>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4">Cód / imóvel</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Vistoriador</th>
              <th className="p-4">Data</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4">
                  <span className="font-bold block text-secondary">{row.codigo}</span>
                  <span className="text-xs text-slate-400">{row.address}</span>
                </td>
                <td className="p-4 text-secondary">{row.tipo}</td>
                <td className="p-4 text-slate-600">{row.vistoriador}</td>
                <td className="p-4 tabular-nums text-slate-600">{row.data}</td>
                <td className="p-4">
                  <StatusPill tone={row.tone} label={row.status} />
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/vistorias/${row.id}`}
                      className="text-primary hover:underline font-bold"
                    >
                      Revisar
                    </Link>
                    {row.hasReport && (
                      <Link
                        href="/public/r/token-mock"
                        className="text-slate-500 hover:underline font-medium"
                      >
                        Relatório
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="md:hidden flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-secondary">{row.codigo}</p>
                <p className="text-sm text-slate-500 mt-0.5">{row.address}</p>
              </div>
              <StatusPill tone={row.tone} label={row.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <span>{row.tipo}</span>
              <span className="text-right tabular-nums">{row.data}</span>
              <span className="col-span-2">{row.vistoriador}</span>
            </div>
            <div className="flex gap-3 pt-1">
              <Link
                href={`/admin/vistorias/${row.id}`}
                className="inline-flex items-center justify-center flex-1 h-11 min-h-[44px] rounded-full bg-primary text-white text-sm font-bold"
              >
                Revisar
              </Link>
              {row.hasReport && (
                <Link
                  href="/public/r/token-mock"
                  className="inline-flex items-center justify-center h-11 min-h-[44px] px-4 rounded-full border border-slate-200 text-sm font-bold text-secondary"
                >
                  PDF
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: "good" | "fair";
  label: string;
}) {
  return (
    <span
      className={
        tone === "good"
          ? "inline-flex bg-green-100 text-green-800 text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1"
          : "inline-flex bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1"
      }
    >
      {label}
    </span>
  );
}
