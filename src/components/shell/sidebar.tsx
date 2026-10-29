"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Tooltip } from "../ui/interactive";
import { Logo } from "./logo";
import { isActive, NAV } from "./nav";

const GROUPS = { principal: "", ferramentas: "Ferramentas", conta: "Conta" } as const;

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-bg md:flex"
      aria-label="Navegação principal"
    >
      <div className={cn("flex h-14 items-center px-4", collapsed ? "justify-center px-0" : "justify-between")}>
        <Link href="/" aria-label="Lastro — visão geral" className="rounded-md">
          <Logo compact={collapsed} />
        </Link>
        {!collapsed && (
          <button onClick={onToggle} className="rounded-md p-1.5 text-subtle hover:bg-elevated hover:text-fg" aria-label="Recolher menu">
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
        {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
          <div key={g} className="mt-3 first:mt-1">
            <AnimatePresence initial={false}>
              {GROUPS[g] && !collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-2.5 pb-1.5 pt-2 text-2xs font-medium uppercase tracking-[0.06em] text-subtle"
                >
                  {GROUPS[g]}
                </motion.p>
              )}
            </AnimatePresence>
            {collapsed && g !== "principal" && <div className="mx-3 my-2 h-px bg-line" />}
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                const badge = item.href === "/alertas" && unread > 0 ? unread : 0;
                const link = (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-md text-[13px] font-medium transition-colors",
                      collapsed ? "justify-center" : "px-2.5",
                      active ? "text-fg" : "text-muted hover:bg-surface hover:text-fg",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-md border border-line bg-surface"
                        transition={{ type: "spring", bounce: 0.12, duration: 0.4 }}
                      />
                    )}
                    {active && (
                      <motion.span layoutId="nav-bar" className="absolute -left-2.5 top-2 h-5 w-[2px] rounded-full bg-fg" />
                    )}
                    <Icon className="relative size-[17px] shrink-0" strokeWidth={1.75} />
                    {!collapsed && <span className="relative truncate">{item.label}</span>}
                    {badge > 0 && (
                      <span
                        className={cn(
                          "num relative grid h-[18px] min-w-[18px] place-items-center rounded-full bg-fg px-1 text-[10px] font-semibold text-bg",
                          collapsed ? "absolute right-1.5 top-1" : "ml-auto",
                        )}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                );
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip content={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed ? (
        <button onClick={onToggle} className="mx-auto mb-4 rounded-md p-2 text-subtle hover:bg-elevated hover:text-fg" aria-label="Expandir menu">
          <PanelLeftOpen className="size-4" />
        </button>
      ) : (
        <div className="m-3 rounded-md border border-line p-3">
          <p className="text-2xs leading-relaxed text-subtle">
            Conteúdo educacional. Não é recomendação de investimento. Rentabilidade passada não garante resultados futuros.
          </p>
        </div>
      )}
    </motion.aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV.filter((n) => ["/", "/guia", "/mercado", "/carteira", "/explorar"].includes(n.href));
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium", active ? "text-fg" : "text-subtle")}
          >
            <Icon className="size-5" strokeWidth={1.75} />
            <span className="max-w-full truncate px-1">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
