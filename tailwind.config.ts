// tailwind.config.ts
// Tokens replicados de DESIGN.md — que por sua vez replica os valores REAIS
// de tailwind_config.js/output.css do site institucional (confirmado, não
// estimado). Qualquer mudança de paleta/tipografia deve ser feita nos dois
// lugares (fonte da verdade é o DESIGN.md).
import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Tokens de marca — valores idênticos ao tailwind_config.js do site
        // institucional (sem escala de tons; usar opacidade via `/10`, `/20`
        // etc. quando precisar de uma variação mais clara — ver DESIGN.md §2.1)
        primary: "#00AEEF",
        "primary-hover": "#009ACD",
        secondary: "#1A2B3C",
        accent: "#FFB703",
        "brand-accent": "#FFB703",
        "background-light": "#F8FAFC",
        "background-dark": "#1A2B3C",
        // Cores de status compatíveis com Lovable
        "status-good": "#16A34A",
        "status-warn": "#D97706",
        "status-bad": "#DC2626",
        // Descoberto via footer_modelo.html — mais escuro que "secondary",
        // usado só no rodapé (ver DESIGN.md §2.2)
        ink: "#050505",
        // Cor funcional de terceiro (WhatsApp) — ver DESIGN.md §2.3
        whatsapp: "#25D366",
        // Tokens semânticos do app (não existem no site — novos, ver DESIGN.md §2.4)
        state: {
          good: "#16A34A",
          fair: "#D97706",
          bad: "#DC2626",
          pending: "#94A3B8",
        },
      },
      fontFamily: {
        // "display" e "sans" apontam para Inter, igual ao site — ver DESIGN.md §3.1
        display: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        // Acento editorial, sempre em itálico quando usado — ver DESIGN.md §3.2
        // Uso restrito à página de relatório público, nunca no app operacional.
        "serif-accent": ["Instrument Serif", "serif"],
      },
      // Sobrescreve o borderRadius padrão do Tailwind com os valores reais
      // do site — ver DESIGN.md §5 (correção importante: é bem mais
      // arredondado do que a primeira versão deste arquivo assumia).
      borderRadius: {
        DEFAULT: "0.25rem", // 4px
        lg: "0.5rem",       // 8px
        xl: "0.75rem",      // 12px
        "2xl": "1rem",      // 16px
        "3xl": "1.5rem",    // 24px
        full: "9999px",
        pill: "50px",
      },
      boxShadow: {
        // Sombra "de marca", tingida de primary — usar só em elementos de
        // marca/CTA, nunca junto com uma sombra neutra de elevação de card.
        soft: "0 4px 6px -1px rgba(0, 174, 239, 0.1)",
      },
    },
  },
  plugins: [
    forms,
    containerQueries,
    typography,
  ],
};

export default config;
