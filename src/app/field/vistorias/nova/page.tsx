"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell, TopBar } from "@/components/app/PhoneShell";
import { Icon } from "@/components/app/Icon";
import { getDB, LocalVistoria } from "@/lib/db/idb";

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function NovaVistoriaPage() {
  const router = useRouter();

  // Form fields
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("SP");
  const [cep, setCep] = useState("");
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA" | "CONTRA_VISTORIA">("ENTRADA");
  const [dataHora, setDataHora] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [nomeLocatario, setNomeLocatario] = useState("");
  const [telefoneLocatario, setTelefoneLocatario] = useState("");
  const [nomeLocador, setNomeLocador] = useState("");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!endereco.trim()) newErrors.endereco = "Endereço é obrigatório";
    if (!bairro.trim()) newErrors.bairro = "Bairro é obrigatório";
    if (!cidade.trim()) newErrors.cidade = "Cidade é obrigatória";
    if (!dataHora) newErrors.dataHora = "Data e hora são obrigatórias";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const db = await getDB();
      if (!db) throw new Error("IDB não disponível");

      const novoId = `vis-local-${Date.now()}`;
      const novoCodigo = `VIS-LOCAL-${Date.now()}`;

      const pessoas: LocalVistoria["imovel"]["pessoas"] = [];
      if (nomeLocatario.trim()) {
        pessoas.push({
          id: `pes-loc-${Date.now()}`,
          nome: nomeLocatario.trim(),
          email: null,
          telefone: telefoneLocatario.trim() || null,
          tipo: "LOCATARIO",
        });
      }
      if (nomeLocador.trim()) {
        pessoas.push({
          id: `pes-prop-${Date.now() + 1}`,
          nome: nomeLocador.trim(),
          email: null,
          telefone: null,
          tipo: "LOCADOR",
        });
      }

      const novaVistoria: LocalVistoria = {
        id: novoId,
        codigo: novoCodigo,
        tipo,
        data: new Date(dataHora).toISOString(),
        status: "EM_ANDAMENTO",
        imovelId: `imovel-local-${Date.now()}`,
        empresaId: "local",
        usuarioId: "local",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imovel: {
          id: `imovel-local-${Date.now()}`,
          endereco: endereco.trim(),
          numero: numero.trim() || null,
          complemento: complemento.trim() || null,
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado,
          cep: cep.trim(),
          pessoas,
        },
      };

      await db.put("vistorias", novaVistoria);

      await db.put("mutation_queue", {
        action: "CREATE_VISTORIA_LOCAL",
        vistoriaId: novoId,
        payload: novaVistoria,
        timestamp: Date.now(),
      });

      router.push(`/field/vistorias/${novoId}`);
    } catch (err) {
      console.error("Erro ao criar vistoria no IDB:", err);
      setSaving(false);
    }
  };

  const tipoOptions: { value: "ENTRADA" | "SAIDA" | "CONTRA_VISTORIA"; label: string; icon: string; color: string }[] = [
    { value: "ENTRADA", label: "Entrada", icon: "login", color: "text-status-good border-status-good bg-status-good/10" },
    { value: "SAIDA", label: "Saída", icon: "logout", color: "text-status-warn border-status-warn bg-status-warn/10" },
    { value: "CONTRA_VISTORIA", label: "Contra-Vistoria", icon: "compare", color: "text-primary border-primary bg-primary/10" },
  ];

  const inputClass = (field: string) =>
    `w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder-slate-300 ${
      errors[field] ? "border-status-bad bg-status-bad/5" : "border-slate-200"
    }`;

  return (
    <PhoneShell showNav={false}>
      <TopBar title="Nova Vistoria" backTo="/field" />

      <form onSubmit={handleSubmit} className="flex-1 px-5 pt-2 pb-32 space-y-6">
        {/* Type selector */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Tipo de Vistoria <span className="text-status-bad">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {tipoOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTipo(opt.value)}
                className={`py-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all font-bold text-xs ${
                  tipo === opt.value
                    ? opt.color
                    : "border-slate-100 text-slate-400 bg-slate-50 hover:border-slate-200"
                }`}
              >
                <Icon name={opt.icon} className="text-[20px]" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Data e Hora <span className="text-status-bad">*</span>
          </label>
          <input
            type="datetime-local"
            value={dataHora}
            onChange={e => { setDataHora(e.target.value); setErrors(prev => ({ ...prev, dataHora: "" })); }}
            className={inputClass("dataHora")}
          />
          {errors.dataHora && <p className="text-[11px] text-status-bad font-semibold">{errors.dataHora}</p>}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Endereço do Imóvel</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Address */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Endereço (rua/avenida) <span className="text-status-bad">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Rua das Flores"
              value={endereco}
              onChange={e => { setEndereco(e.target.value); setErrors(prev => ({ ...prev, endereco: "" })); }}
              className={inputClass("endereco")}
            />
            {errors.endereco && <p className="text-[11px] text-status-bad font-semibold">{errors.endereco}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Número</label>
              <input
                type="text"
                placeholder="Ex: 123"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                className={inputClass("numero")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Complemento</label>
              <input
                type="text"
                placeholder="Ex: Apto 42"
                value={complemento}
                onChange={e => setComplemento(e.target.value)}
                className={inputClass("complemento")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Bairro <span className="text-status-bad">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Centro"
              value={bairro}
              onChange={e => { setBairro(e.target.value); setErrors(prev => ({ ...prev, bairro: "" })); }}
              className={inputClass("bairro")}
            />
            {errors.bairro && <p className="text-[11px] text-status-bad font-semibold">{errors.bairro}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Cidade <span className="text-status-bad">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={cidade}
                onChange={e => { setCidade(e.target.value); setErrors(prev => ({ ...prev, cidade: "" })); }}
                className={inputClass("cidade")}
              />
              {errors.cidade && <p className="text-[11px] text-status-bad font-semibold">{errors.cidade}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Estado</label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium"
              >
                {ESTADOS_BR.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">CEP</label>
            <input
              type="text"
              placeholder="00000-000"
              value={cep}
              onChange={e => setCep(e.target.value)}
              className={inputClass("cep")}
              maxLength={9}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Envolvidos (opcional)</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* People */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="person" className="text-[18px] text-status-good" />
              <span className="text-xs font-bold text-secondary">Locatário / Inquilino</span>
            </div>
            <input
              type="text"
              placeholder="Nome completo"
              value={nomeLocatario}
              onChange={e => setNomeLocatario(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder-slate-300"
            />
            <input
              type="tel"
              placeholder="Telefone (com DDD)"
              value={telefoneLocatario}
              onChange={e => setTelefoneLocatario(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder-slate-300"
            />
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="home" className="text-[18px] text-primary" />
              <span className="text-xs font-bold text-secondary">Proprietário / Locador</span>
            </div>
            <input
              type="text"
              placeholder="Nome completo"
              value={nomeLocador}
              onChange={e => setNomeLocador(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium placeholder-slate-300"
            />
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-3 bg-primary/5 border border-primary/20 p-4 rounded-2xl">
          <Icon name="info" className="text-primary text-[20px] shrink-0 mt-0.5" />
          <p className="text-xs text-secondary/70 font-medium leading-relaxed">
            Esta vistoria será criada localmente e sincronizada com o servidor quando houver conexão disponível.
          </p>
        </div>
      </form>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-background-light via-background-light to-transparent md:max-w-md md:mx-auto z-20">
        <button
          type="submit"
          form=""
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-16 rounded-full bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:bg-[#009acd] transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? (
            <>
              <Icon name="progress_activity" className="text-[22px] animate-spin" />
              Criando vistoria...
            </>
          ) : (
            <>
              <Icon name="add_circle" className="text-[22px]" />
              Criar Vistoria
            </>
          )}
        </button>
      </div>
    </PhoneShell>
  );
}
