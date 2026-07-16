import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  barClassName?: string;
  size?: "sm" | "md";
  label?: string;
  meta?: string;
};

export function Progress({
  value,
  className,
  barClassName,
  size = "md",
  label,
  meta,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={cn("w-full space-y-1", className)}>
      {(label || meta) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <span className="text-xs font-semibold text-secondary/70">{label}</span>
          ) : (
            <span />
          )}
          {meta ? (
            <span className="text-xs font-semibold text-slate-400 tabular-nums">{meta}</span>
          ) : null}
        </div>
      )}
      <div
        className={cn("w-full rounded-full bg-slate-100 overflow-hidden", height)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-500 ease-out",
            barClassName,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
