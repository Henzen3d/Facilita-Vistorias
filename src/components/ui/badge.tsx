import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "primary" | "good" | "fair" | "bad" | "pending" | "accent" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  good: "bg-green-100 text-green-800 border-green-200",
  fair: "bg-amber-100 text-amber-800 border-amber-200",
  bad: "bg-red-100 text-red-700 border-red-200",
  /* slate-600 melhora contraste WCAG vs slate-500 em fundos claros */
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  accent: "bg-accent/15 text-secondary border-accent/30",
  neutral: "bg-slate-50 text-slate-600 border-slate-100",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
