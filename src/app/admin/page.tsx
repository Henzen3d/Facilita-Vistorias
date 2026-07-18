import Link from "next/link";
import { Icon } from "@/components/app/Icon";

const navItems = [
  { href: "/admin/agenda", icon: "calendar_month", label: "Agenda & calendário" },
  { href: "/admin/vistorias", icon: "assignment", label: "Gerenciar vistorias" },
  { href: "/admin/assinaturas", icon: "draw", label: "Assinaturas" },
  { href: "/admin/contestacoes", icon: "gavel", label: "Contestações" },
  { href: "/admin/cadastros", icon: "settings", label: "Cadastros" },
] as const;

const recent = [
  {
    id: "1",
    address: "Rua XV de Novembro, 1234 — Ap 302",
    meta: "Osmar Gonçalves · Entrada",
    status: "Concluída",
    tone: "good" as const,
  },
  {
    id: "2",
    address: "Alameda Rio Branco, 45 — Casa 02",
    meta: "Osmar Gonçalves · Saída",
    status: "Em revisão",
    tone: "fair" as const,
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-[100dvh] bg-background-light font-sans text-secondary p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1">
            Painel administrativo
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Facilita Vistorias
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Métricas e atalhos operacionais
          </p>
        </div>
        <Link
          href="/admin/agenda"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-white text-sm font-bold hover:bg-primary-hover transition-colors duration-200 shadow-soft min-h-[48px] active:scale-[0.98]"
        >
          <Icon name="add" className="text-[20px]" />
          Nova vistoria
        </Link>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Kpi
          label="Vistorias concluídas (mês)"
          value="42"
          hint="↑ 12% vs mês anterior"
          hintTone="good"
          icon="task_alt"
        />
        <Kpi
          label="Tempo médio de entrega"
          value="1,5 d"
          hint="Campo → envio"
          icon="schedule"
        />
        <Kpi
          label="Aceito sem edição IA"
          value="84%"
          hint="Acerto do provedor"
          icon="auto_awesome"
        />
        <Kpi
          label="Taxa de contestação"
          value="4,7%"
          hint="2 vistorias contestadas"
          hintTone="bad"
          icon="gavel"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-secondary">Vistorias recentes</h2>
            <Link
              href="/admin/vistorias"
              className="text-primary text-sm hover:underline font-bold min-h-[44px] inline-flex items-center"
            >
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recent.map((row) => (
              <li key={row.id} className="py-4 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-secondary truncate">
                    {row.address}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{row.meta}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={
                      row.tone === "good"
                        ? "bg-green-100 text-green-800 text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1"
                        : "bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1"
                    }
                  >
                    {row.status}
                  </span>
                  <Link
                    href={`/admin/vistorias/${row.id}`}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Abrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-secondary mb-4">Navegação</h2>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="p-3 min-h-[48px] bg-background-light rounded-xl hover:bg-primary/5 hover:border-primary/20 border border-transparent font-medium text-sm flex items-center gap-3 transition-colors"
              >
                <span className="h-9 w-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-primary">
                  <Icon name={item.icon} className="text-[20px]" />
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  hintTone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  hintTone?: "good" | "bad";
  icon: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide leading-snug">
          {label}
        </span>
        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-[20px]" />
        </span>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-secondary tabular-nums">{value}</h2>
      <span
        className={`text-xs font-medium ${
          hintTone === "good"
            ? "text-status-good"
            : hintTone === "bad"
              ? "text-status-bad"
              : "text-slate-600"
        }`}
      >
        {hint}
      </span>
    </div>
  );
}
