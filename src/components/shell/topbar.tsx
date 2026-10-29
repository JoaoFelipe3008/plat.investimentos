"use client";

import * as P from "@radix-ui/react-popover";
import * as D from "@radix-ui/react-dialog";
import { Bell, CheckCheck, Eye, EyeOff, Menu, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Tooltip } from "../ui/interactive";
import { CommandMenu } from "./command-menu";
import { Logo } from "./logo";
import { isActive, NAV } from "./nav";

export function Topbar() {
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const name = useApp((s) => s.profile?.name ?? "");
  const hide = useApp((s) => s.settings.hideValues);
  const setSetting = useApp((s) => s.setSetting);
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md md:px-6">
      <button className="rounded-md p-1.5 text-muted hover:bg-elevated hover:text-fg md:hidden" onClick={() => setMenu(true)} aria-label="Abrir menu">
        <Menu className="size-5" />
      </button>
      <Link href="/" className="md:hidden" aria-label="Lastro">
        <Logo compact />
      </Link>

      <button
        onClick={() => setSearch(true)}
        className="flex h-9 w-full max-w-md items-center gap-2.5 rounded-md border border-line bg-surface px-3 text-[13px] text-subtle transition-colors hover:border-line-strong hover:text-muted"
      >
        <Search className="size-4" />
        <span className="truncate">Buscar ativos, lições, termos…</span>
        <kbd className="ml-auto hidden rounded border border-line px-1.5 text-2xs sm:inline">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip content={hide ? "Mostrar valores" : "Ocultar valores"}>
          <button
            onClick={() => setSetting("hideValues", !hide)}
            className="rounded-md p-2 text-muted hover:bg-elevated hover:text-fg"
            aria-label={hide ? "Mostrar valores" : "Ocultar valores"}
            aria-pressed={hide}
          >
            {hide ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        </Tooltip>
        <Notifications />
        <Link
          href="/configuracoes"
          className="ml-1 grid size-8 place-items-center rounded-full border border-line-strong bg-elevated text-xs font-semibold text-fg hover:border-fg/40"
          aria-label="Configurações da conta"
        >
          {name ? name.trim()[0]?.toUpperCase() : "?"}
        </Link>
      </div>

      <CommandMenu open={search} onOpenChange={setSearch} />
      <MobileDrawer open={menu} onOpenChange={setMenu} />
    </header>
  );
}

function Notifications() {
  const notifications = useApp((s) => s.notifications);
  const markRead = useApp((s) => s.markRead);
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger asChild>
        <button className="relative rounded-md p-2 text-muted hover:bg-elevated hover:text-fg" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}>
          <Bell className="size-[18px]" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-fg ring-2 ring-bg" />}
        </button>
      </P.Trigger>
      <P.Portal>
        <P.Content align="end" sideOffset={8} collisionPadding={12} className="z-50 w-[min(380px,calc(100vw-24px))] rounded-lg border border-line-strong bg-surface shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[13px] font-medium">Notificações</p>
            {unread > 0 && (
              <button onClick={() => markRead("all")} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg">
                <CheckCheck className="size-3.5" /> Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-muted">
                Nenhuma notificação. Crie alertas para ser avisado sobre preços, notícias e a Selic.
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.href?.startsWith("http")) window.open(n.href, "_blank", "noopener");
                    else if (n.href) router.push(n.href);
                  }}
                  className="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-elevated/60"
                >
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-fg")} />
                  <span className="min-w-0">
                    <span className={cn("block text-[13px]", n.read ? "text-muted" : "font-medium text-fg")}>{n.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-subtle">{n.body}</span>
                    <span className="mt-1 block text-2xs text-subtle">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link href="/alertas" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-2.5 text-center text-xs text-muted hover:text-fg">
            Abrir central de alertas
          </Link>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

function MobileDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const pathname = usePathname();
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </D.Overlay>
            <D.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-bg p-3"
              >
                <div className="mb-3 flex items-center justify-between px-2 py-1">
                  <Logo />
                  <D.Close className="rounded-md p-1.5 text-muted hover:bg-elevated" aria-label="Fechar menu">
                    <X className="size-4" />
                  </D.Close>
                </div>
                <D.Title className="sr-only">Menu</D.Title>
                <nav className="space-y-0.5">
                  {NAV.map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-md px-3 text-sm",
                        isActive(pathname, n.href) ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg",
                      )}
                    >
                      <n.icon className="size-[18px]" strokeWidth={1.75} />
                      {n.label}
                    </Link>
                  ))}
                </nav>
                <p className="mt-auto px-2 text-2xs leading-relaxed text-subtle">
                  Conteúdo educacional. Não é recomendação de investimento.
                </p>
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}
