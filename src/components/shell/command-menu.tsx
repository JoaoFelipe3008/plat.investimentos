"use client";

import * as D from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { BookOpen, Hash, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ASSETS, CATEGORY_LABEL } from "@/data/assets";
import { GLOSSARY } from "@/data/glossary";
import { ALL_LESSONS } from "@/data/lessons";
import { NAV } from "./nav";

const item =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] text-muted data-[selected=true]:bg-elevated data-[selected=true]:text-fg";
const group = "px-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-subtle";

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const go = (href: string) => {
    onOpenChange(false);
    if (href.startsWith("http")) window.open(href, "_blank", "noopener");
    else router.push(href);
  };

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} />
            </D.Overlay>
            <D.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-32px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-line-strong bg-surface shadow-2xl shadow-black/60"
              >
                <D.Title className="sr-only">Busca global</D.Title>
                <Command label="Busca global" loop>
                  <div className="flex items-center gap-3 border-b border-line px-4">
                    <Search className="size-4 text-subtle" />
                    <Command.Input
                      autoFocus
                      placeholder="Buscar ativos, lições, páginas ou termos…"
                      className="h-12 w-full bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none"
                    />
                    <kbd className="rounded border border-line px-1.5 py-0.5 text-2xs text-subtle">Esc</kbd>
                  </div>
                  <Command.List className="max-h-[56vh] overflow-y-auto pb-2">
                    <Command.Empty className="px-4 py-8 text-center text-[13px] text-muted">Nada encontrado.</Command.Empty>
                    <Command.Group heading="Ativos e indicadores" className={group}>
                      {ASSETS.map((a) => (
                        <Command.Item
                          key={a.symbol}
                          value={`${a.symbol} ${a.name} ${a.keywords.join(" ")}`}
                          onSelect={() => go(`/explorar/${a.symbol}`)}
                          className={item}
                        >
                          <span className="num w-[92px] shrink-0 truncate font-medium text-fg">{a.symbol}</span>
                          <span className="truncate">{a.name}</span>
                          <span className="ml-auto shrink-0 text-2xs text-subtle">{CATEGORY_LABEL[a.category]}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <Command.Group heading="Páginas" className={group}>
                      {NAV.map((n) => (
                        <Command.Item key={n.href} value={`pagina ${n.label}`} onSelect={() => go(n.href)} className={item}>
                          <n.icon className="size-4" strokeWidth={1.75} />
                          {n.label}
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <Command.Group heading="Lições" className={group}>
                      {ALL_LESSONS.map((l) => (
                        <Command.Item
                          key={`${l.moduleId}/${l.id}`}
                          value={`licao ${l.title} ${l.summary}`}
                          onSelect={() => go(`/guia/${l.moduleId}/${l.id}`)}
                          className={item}
                        >
                          <BookOpen className="size-4" strokeWidth={1.75} />
                          <span className="truncate">{l.title}</span>
                          <span className="ml-auto shrink-0 text-2xs text-subtle">Módulo {l.moduleNumber}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <Command.Group heading="Glossário" className={group}>
                      {Object.entries(GLOSSARY).map(([id, g]) => (
                        <Command.Item key={id} value={`glossario ${g.term} ${g.short}`} onSelect={() => go(`/guia#glossario-${id}`)} className={item}>
                          <Hash className="size-4" strokeWidth={1.75} />
                          <span className="shrink-0 text-fg">{g.term}</span>
                          <span className="truncate text-subtle">{g.short}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </Command.List>
                </Command>
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}
