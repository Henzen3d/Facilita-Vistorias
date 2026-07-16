"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type PhoneShellProps = {
  children: ReactNode;
  showNav?: boolean;
  bg?: "app" | "dark" | "white";
};

export function PhoneShell({ children, showNav = true, bg = "app" }: PhoneShellProps) {
  const pathname = usePathname();
  const params = useParams();
  
  // Extract dynamic vistoria ID if available
  const id = params?.id || "1";

  const navItems = [
    { href: "/field", icon: "home", label: "Início" },
    { href: `/field/vistorias/${id}/ambientes`, icon: "grid_view", label: "Cômodos" },
    { href: "/field/sync", icon: "cloud_sync", label: "Sincronizar" },
    { href: `/field/vistorias/${id}/resumo`, icon: "assignment_turned_in", label: "Resumo" },
  ] as const;

  const bgClass = bg === "dark" ? "bg-secondary" : bg === "white" ? "bg-card" : "bg-background-light";
  
  return (
    <div className={cn("min-h-screen w-full flex flex-col relative pb-20", bgClass)}>
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {showNav && (
        <nav
          aria-label="Navegação Principal"
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100/80 px-2 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] z-40 shadow-[0_-8px_30px_rgba(26,43,60,0.06)] max-w-md md:max-w-xl mx-auto md:rounded-t-2xl"
        >
          <ul className="flex items-center justify-around">
            {navItems.map((item) => {
              // Check if current item is active
              const active = pathname === item.href || (item.href !== "/field" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      "flex flex-col items-center gap-0.5 min-w-[64px] min-h-[44px] px-3 py-1.5 rounded-2xl transition-colors",
                      active
                        ? "text-primary font-semibold bg-primary/8"
                        : "text-slate-400 hover:text-secondary"
                    )}
                  >
                    <Icon name={item.icon} filled={active} className="text-[26px]" weight={active ? 600 : 400} />
                    <span className="text-[11px] font-medium tracking-wide mt-0.5">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

export function TopBar({
  title,
  backTo,
  right,
  dark = false,
}: {
  title: string;
  backTo?: string;
  right?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 px-4 pt-2 pb-3 select-none", dark ? "text-white" : "text-secondary")}>
      {backTo ? (
        <Link
          href={backTo}
          aria-label="Voltar"
          className={cn(
            "inline-flex items-center justify-center h-11 w-11 rounded-full transition-colors",
            dark ? "hover:bg-white/10" : "hover:bg-slate-100"
          )}
        >
          <Icon name="arrow_back" className="text-[24px]" />
        </Link>
      ) : (
        <span className="w-11" />
      )}
      <h1 className="flex-1 text-base font-bold text-center truncate">{title}</h1>
      <div className="w-11 flex items-center justify-end">{right}</div>
    </div>
  );
}
