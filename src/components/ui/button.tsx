import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-soft disabled:opacity-50",
  secondary:
    "bg-secondary text-white hover:bg-secondary/90 disabled:opacity-50",
  ghost:
    "bg-transparent text-secondary hover:bg-slate-100 disabled:opacity-50",
  outline:
    "bg-white text-secondary border border-slate-200 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50",
  danger:
    "bg-status-bad text-white hover:bg-status-bad/90 disabled:opacity-50",
  whatsapp:
    "bg-whatsapp text-white hover:bg-whatsapp/90 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 min-h-[40px] px-4 text-sm gap-1.5",
  md: "h-12 min-h-[48px] px-5 text-sm gap-2",
  lg: "h-14 min-h-[56px] px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
