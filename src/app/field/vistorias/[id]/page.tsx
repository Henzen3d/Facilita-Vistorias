"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { getDB, LocalVistoria } from "@/lib/db/idb";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FieldVistoriaDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [vistoria, setVistoria] = useState<LocalVistoria | null>(null);
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
            <p className="text-xs text-slate-400">Carregando detalhes...</p>
          </div>
        </div>
      </PhoneShell>
    );
  }

  if (!vistoria) {
    return (
      <PhoneShell showNav={false}>
        <TopBar title="Vistoria não encontrada" backTo="/field" />
        <div className="flex-1 flex items-center justify-center p-6 text-center space-y-4">
          <div>
            <div className="h-16 w-16 bg-status-bad/10 text-status-bad rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="error" className="text-[32px]" />
            </div>
            <h3 className="text-base font-bold text-secondary">Vistoria não localizada</h3>
            <p className="text-xs text-slate-400 mt-1">
              Esta vistoria não foi pré-carregada ou não existe no aparelho.
            </p>
            <Link
              href="/field"
              className="inline-block mt-4 text-xs font-bold text-primary hover:underline"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </PhoneShell>
    );
  }

  // Get people (locador, locatario)
  const pessoas = vistoria.imovel.pessoas || [];
  const locatario = pessoas.find(p => p.tipo === "LOCATARIO");
  const locador = pessoas.find(p => p.tipo === "LOCADOR");

  // Format type tag
  let badgeClass = "bg-primary/10 text-primary";
  let typeLabel = "Vistoria";
  if (vistoria.tipo === "ENTRADA") {
    badgeClass = "bg-status-good/10 text-status-good";
    typeLabel = "Entrada";
  } else if (vistoria.tipo === "SAIDA") {
    badgeClass = "bg-status-warn/10 text-status-warn";
    typeLabel = "Saída";
  }

  return (
    <PhoneShell showNav={false}>
      <TopBar
        title="Detalhes da Vistoria"
        backTo="/field"
        right={
          <button aria-label="Mais opções" className="h-11 w-11 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Icon name="more_vert" className="text-[22px] text-secondary" />
          </button>
        }
      />

      <div className="px-5">
        {/* Status Header */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> {typeLabel}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">CÓDIGO: {vistoria.codigo}</span>
        </div>

        {/* Address */}
        <h1 className="mt-3 text-[22px] font-bold text-secondary leading-tight">
          {vistoria.imovel.endereco}, {vistoria.imovel.numero}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {vistoria.imovel.complemento ? `${vistoria.imovel.complemento} · ` : ""}
          {vistoria.imovel.bairro}, {vistoria.imovel.cidade} - {vistoria.imovel.estado}
        </p>

        {/* Faux map mockup */}
        <div className="mt-5 aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100 relative shadow-inner border border-slate-200">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #dfeaf3 0%, #eaf2f8 45%, #d9e6ef 100%)",
            }}
          />
          <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full opacity-60">
            <path d="M0 180 Q80 120 200 150 T400 100" stroke="#c8d5df" strokeWidth="20" fill="none" />
            <path d="M0 180 Q80 120 200 150 T400 100" stroke="#ffffff" strokeWidth="4" fill="none" />
            <path d="M60 0 L120 250" stroke="#c8d5df" strokeWidth="14" />
            <path d="M60 0 L120 250" stroke="#ffffff" strokeWidth="3" />
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-white">
              <Icon name="location_on" filled className="text-white text-[18px]" />
            </div>
            <div className="h-3 w-3 rotate-45 -mt-1.5 bg-primary border-r-4 border-b-4 border-white" />
          </div>
        </div>
      </div>

      {/* Client contacts */}
      <section className="px-5 mt-6 flex flex-col gap-3">
        {locatario && (
          <PersonRow role="Locatário" name={locatario.nome} phone={locatario.telefone || "Não informado"} />
        )}
        {locador && (
          <PersonRow role="Locador" name={locador.nome} phone={locador.telefone || "Não informado"} />
        )}
      </section>

      {/* Property Facts */}
      <section className="px-5 mt-5">
        <div className="grid grid-cols-3 gap-3">
          <MiniFact icon="home_work" label="Tipo" value="Residencial" />
          <MiniFact icon="straighten" label="Área" value="72 m²" />
          <MiniFact icon="meeting_room" label="Ambientes" value="6" />
        </div>
      </section>

      {/* Safety check warning */}
      <section className="px-5 mt-5">
        <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4 flex gap-3 select-none">
          <Icon name="info" className="text-accent text-[22px]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary">Checklist recomendado</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute o protocolo de chegada no imóvel antes de iniciar a vistoria técnica dos ambientes.
            </p>
          </div>
        </div>
      </section>

      {/* Steps indicators */}
      <div className="px-5 mt-6 flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 select-none">
        <span className="text-primary">1. Info</span>
        <span>2. Protocolo</span>
        <span>3. Cômodos</span>
        <span>4. Fim</span>
      </div>

      {/* Iniciar Button */}
      <div className="mt-auto px-5 pt-6 pb-8 sticky bottom-0 bg-gradient-to-t from-background-light via-background-light to-background-light/0">
        <Link
          href={`/field/vistorias/${id}/ambientes`}
          className="w-full h-16 rounded-full bg-primary hover:bg-[#009acd] text-white text-base font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all"
        >
          Iniciar Protocolo de Chegada
          <Icon name="arrow_forward" className="text-[22px]" />
        </Link>
      </div>
    </PhoneShell>
  );
}

function PersonRow({ role, name, phone }: { role: string; name: string; phone: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm select-none">
      <div className="h-11 w-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
        <Icon name="person" className="text-secondary text-[22px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{role}</p>
        <p className="text-sm font-semibold text-secondary truncate">{name}</p>
        <p className="text-xs text-slate-400">{phone}</p>
      </div>
      {phone !== "Não informado" && (
        <a
          href={`tel:${phone.replace(/\D/g, "")}`}
          aria-label={`Ligar para ${name}`}
          className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <Icon name="call" className="text-primary text-[20px]" />
        </a>
      )}
    </div>
  );
}

function MiniFact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-1 shadow-sm select-none">
      <Icon name={icon} className="text-[18px] text-primary" />
      <div className="text-xs font-bold text-secondary leading-tight">{value}</div>
      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
    </div>
  );
}
