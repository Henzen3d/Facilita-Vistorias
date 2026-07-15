import { cn } from "@/lib/utils";

type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  weight?: 300 | 400 | 500 | 600 | 700;
};

export function Icon({ name, className, filled = false, weight = 400 }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined leading-none select-none", className)}
      style={{
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" ${weight}, "GRAD" 0, "opsz" 24`,
      }}
    >
      {name}
    </span>
  );
}
