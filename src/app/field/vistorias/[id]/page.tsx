"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { Badge } from "@/components/ui/badge";
import { getDB, LocalVistoria } from "@/lib/db/idb";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

function mapsUrl(v: LocalVistoria) {
  const q = encodeURIComponent(
    `${v.imovel.endereco}, ${v.imovel.numero || ""} ${v.imovel.bairro} ${v.imovel.cidade} ${v.imovel.estado}`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function whatsappUrl(phone: string, codigo: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const text = encodeURIComponent(
    `Olá! Sou da Facilita Vistorias. Sobre a vistoria ${codigo} no imóvel.`,
  );
  return `https://wa.me/${withCountry}?text=${text}`;
}

export default function FieldVistoriaDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [vistoria, setVistoria] = useState<LocalVistoria | null>(null);
  const [ambienteCount, setAmbienteCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [itemsDone, setItemsDone] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVistoria = async () => {
      try {
        const db = await getDB();
        if (db) {
          const item = await db.get("vistorias", id);
          if (item) {
            setVistoria(item);
          }
          const ambientes = (await db.getAll("ambientes")).filter(
            (a) => a.vistoriaId === id,
          );
          setAmbienteCount(ambientes.length);
          const ambIds = new Set(ambientes.map((a) => a.id));
          const items = (await db.getAll("items")).filter((i) =>
            ambIds.has(i.ambienteId),
          );
          setItemCount(items.length);
          setItemsDone(items.filter((i) => i.status !== "PENDENTE").length);
        }
      } catch (err) {
        console.error("Erro ao ler vistoria do IDB:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVistoria();
  }, [id]);

  if (loading) {
    return (
      <PhoneShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Icon name="progress_activity" className="text-3xl text-primary animate-spin" />
            <p className="text-sm text-slate-500">Carregando detalhes…</p>
          </div>
        </div>
      </PhoneShell>
    );
  }

  if (!vistoria) {
    return (
      <PhoneShell showNav={false}>
        <TopBar title="Vistoria não encontrada" backTo="/field" />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="h-16 w-16 bg-red-50 text-status-bad rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="error" className="text-[32px]" />
            </div>
            <h3 className="text-base font-bold text-secondary">Vistoria não localizada</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-[28ch] mx-auto">
              Esta vistoria não foi pré-carregada ou não existe no aparelho.
            </p>
            <Link
              href="/field"
              className="inline-flex items-center justify-center mt-4 min-h-[44px] text-sm font-bold text-primary hover:underline"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </PhoneShell>
    );
  }

  const pessoas = vistoria.imovel.pessoas || [];
  const locatario = pessoas.find((p) => p.tipo === "LOCATARIO");
  const locador = pessoas.find((p) => p.tipo === "LOCADOR");

  let badgeTone: "good" | "fair" | "primary" | "pending" = "primary";
  let typeLabel = "Vistoria";
  if (vistoria.tipo === "ENTRADA") {
    badgeTone = "good";
    typeLabel = "Entrada";
  } else if (vistoria.tipo === "SAIDA") {
    badgeTone = "fair";
    typeLabel = "Saída";
  } else if (vistoria.tipo === "CONTRA_VISTORIA") {
    badgeTone = "primary";
    typeLabel = "Contra-vistoria";
  }

  const dateStr = new Date(vistoria.data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const wa =
    locatario?.telefone && locatario.telefone !== "Não informado"
      ? whatsappUrl(locatario.telefone, vistoria.codigo)
      : null;

  const step =
    itemsDone > 0
      ? 3
      : vistoria.status === "EM_ANDAMENTO" || vistoria.status === "EM_REVISAO"
        ? 2
        : 1;

  const ctaLabel =
    itemsDone > 0
      ? "Continuar cômodos"
      : "Iniciar protocolo de chegada";

  return (
    <PhoneShell showNav={false}>
      <TopBar title="Detalhes da vistoria" backTo="/field" />

      <div className="px-5 pb-32 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={badgeTone}>{typeLabel}</Badge>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {vistoria.codigo}
          </span>
        </div>

        <div>
          <h1 className="text-[22px] font-bold text-secondary leading-tight">
            {vistoria.imovel.endereco}, {vistoria.imovel.numero}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {vistoria.imovel.complemento ? `${vistoria.imovel.complemento} · ` : ""}
            {vistoria.imovel.bairro}, {vistoria.imovel.cidade} - {vistoria.imovel.estado}
          </p>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5">
            <Icon name="schedule" className="text-[16px]" />
            {dateStr}
          </p>
        </div>

        {/* Map + pin */}
        <div className="aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100 relative shadow-inner border border-slate-100">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #dfeaf3 0%, #eaf2f8 45%, #d9e6ef 100%)",
            }}
          />
          <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full opacity-60" aria-hidden>
            <path d="M0 180 Q80 120 200 150 T400 100" stroke="#c8d5df" strokeWidth="20" fill="none" />
            <path d="M0 180 Q80 120 200 150 T400 100" stroke="#ffffff" strokeWidth="4" fill="none" />
            <path d="M60 0 L120 250" stroke="#c8d5df" strokeWidth="14" />
            <path d="M60 0 L120 250" stroke="#ffffff" strokeWidth="3" />
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
            <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-white">
              <Icon name="location_on" filled className="text-white text-[18px]" />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={mapsUrl(vistoria)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 min-h-[56px] rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm hover:border-primary/30 transition-colors active:scale-[0.98]"
          >
            <span className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="map" className="text-[22px]" />
            </span>
            <div className="min-w-0 text-left">
              <p className="text-sm font-bold text-secondary">Navegar</p>
              <p className="text-xs text-slate-400 truncate">GPS / Maps</p>
            </div>
          </a>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 min-h-[56px] rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm hover:border-whatsapp/40 transition-colors active:scale-[0.98]"
            >
              <span className="h-11 w-11 rounded-xl bg-whatsapp/15 text-whatsapp flex items-center justify-center shrink-0">
                <Icon name="chat" className="text-[22px]" />
              </span>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-secondary">WhatsApp</p>
                <p className="text-xs text-slate-400 truncate">Locatário</p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 min-h-[56px] rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 opacity-60">
              <span className="h-11 w-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                <Icon name="chat" className="text-[22px]" />
              </span>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-slate-500">WhatsApp</p>
                <p className="text-xs text-slate-400">Sem telefone</p>
              </div>
            </div>
          )}
        </div>

        {/* Contacts */}
        <section className="flex flex-col gap-3">
          {locatario && (
            <PersonRow
              role="Locatário"
              name={locatario.nome}
              phone={locatario.telefone || "Não informado"}
            />
          )}
          {locador && (
            <PersonRow
              role="Locador"
              name={locador.nome}
              phone={locador.telefone || "Não informado"}
            />
          )}
          {!locatario && !locador && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-sm text-slate-500">
              Nenhuma pessoa vinculada a este imóvel no aparelho.
            </div>
          )}
        </section>

        {/* Facts */}
        <section className="grid grid-cols-3 gap-3">
          <MiniFact icon="meeting_room" label="Cômodos" value={String(ambienteCount || "—")} />
          <MiniFact icon="inventory_2" label="Itens" value={String(itemCount || "—")} />
          <MiniFact
            icon="task_alt"
            label="Feitos"
            value={itemCount > 0 ? `${itemsDone}/${itemCount}` : "—"}
          />
        </section>

        {/* Safety tip */}
        <div className="rounded-2xl bg-accent/10 border border-accent/25 p-4 flex gap-3">
          <Icon name="info" className="text-accent text-[22px] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-secondary">Checklist recomendado</p>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              Execute o protocolo de chegada no imóvel antes da vistoria técnica dos ambientes.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <nav aria-label="Etapas da vistoria" className="pt-1">
          <ol className="grid grid-cols-4 gap-2">
            {[
              { n: 1, label: "Info" },
              { n: 2, label: "Protocolo" },
              { n: 3, label: "Cômodos" },
              { n: 4, label: "Fim" },
            ].map((s) => {
              const active = s.n === step;
              const done = s.n < step;
              return (
                <li
                  key={s.n}
                  className={cn(
                    "rounded-2xl border px-2 py-3 text-center min-h-[64px] flex flex-col items-center justify-center gap-1",
                    active && "border-primary bg-primary/10 text-primary",
                    done && "border-status-good/30 bg-green-50 text-status-good",
                    !active && !done && "border-slate-100 bg-white text-slate-400",
                  )}
                >
                  <span className="text-xs font-bold tabular-nums">
                    {done ? "✓" : s.n}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background-light via-background-light to-transparent md:max-w-md md:mx-auto z-20">
        <Link
          href={`/field/vistorias/${id}/ambientes`}
          className="flex items-center justify-center gap-2 w-full h-14 min-h-[56px] rounded-full bg-primary hover:bg-primary-hover text-white text-base font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
        >
          {ctaLabel}
          <Icon name="arrow_forward" className="text-[22px]" />
        </Link>
      </div>
    </PhoneShell>
  );
}

function PersonRow({
  role,
  name,
  phone,
}: {
  role: string;
  name: string;
  phone: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <div className="h-11 w-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon name="person" className="text-secondary text-[22px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{role}</p>
        <p className="text-sm font-semibold text-secondary truncate">{name}</p>
        <p className="text-sm text-slate-500">{phone}</p>
      </div>
      {phone !== "Não informado" && (
        <a
          href={`tel:${phone.replace(/\D/g, "")}`}
          aria-label={`Ligar para ${name}`}
          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <Icon name="call" className="text-primary text-[20px]" />
        </a>
      )}
    </div>
  );
}

function MiniFact({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
      <Icon name={icon} className="text-[20px] text-primary" />
      <div className="text-sm font-bold text-secondary leading-tight tabular-nums">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  );
}
