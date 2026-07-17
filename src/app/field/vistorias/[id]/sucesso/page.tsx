"use client";

import React, { use } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FieldVistoriaSuccess({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  return (
    <PhoneShell showNav={false} bg="white">
      <div className="flex-1 flex flex-col justify-center px-6 text-center space-y-6">
        <div className="h-20 w-20 bg-status-good/10 text-status-good rounded-full flex items-center justify-center mx-auto shadow-sm select-none">
          <Icon name="check_circle" filled className="text-[44px]" />
        </div>
        
        <div className="space-y-2.5">
          <h2 className="text-xl font-bold tracking-tight text-secondary">Vistoria Finalizada!</h2>
          <p className="text-xs text-slate-400 leading-relaxed px-4">
            Captura em campo concluída (em revisão). Sincronize as mídias, revise
            as descrições técnicas e gere o relatório fotográfico em PDF.
          </p>
        </div>

        <div className="space-y-3.5 pt-4">
          <Link
            href={`/field/vistorias/${id}/revisao-ia`}
            className="w-full h-14 rounded-full bg-primary hover:bg-[#009acd] text-white font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="rate_review" className="text-[20px]" />
            Revisar e gerar PDF (online)
          </Link>

          <a
            href="https://wa.me/5547999999999?text=Ol%C3%A1%2C%20a%20vistoria%20residencial%20j%C3%A1%20foi%20conclu%C3%ADda!"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-14 rounded-full bg-[#25D366] hover:bg-[#20ba56] text-white font-bold text-sm shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="chat" className="text-[20px]" />
            Notificar pelo WhatsApp
          </a>

          <Link
            href="/field"
            className="w-full h-14 rounded-full bg-secondary hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center transition-all"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}
