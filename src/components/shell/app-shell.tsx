"use client";

import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAlertEngine } from "@/lib/alerts";
import { useApp, useHydrated } from "@/lib/store";
import { useRemoteSync } from "@/lib/supabase/sync";
import { Skeleton } from "../ui/primitives";
import { MobileNav, Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const COLLAPSE_KEY = "lastro:sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const profile = useApp((s) => s.profile);
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  useEffect(() => {
    if (hydrated && !profile) router.replace("/bem-vindo");
  }, [hydrated, profile, router]);

  useAlertEngine();
  useRemoteSync();

  return (
    <div className="flex min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-bg">
        Pular para o conteúdo
      </a>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="conteudo" className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-12">
          {hydrated && profile ? (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1280px]"
            >
              {children}
            </motion.div>
          ) : (
            <div className="mx-auto w-full max-w-[1280px] space-y-4" aria-busy>
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-40 md:col-span-2" />
                <Skeleton className="h-40" />
              </div>
              <Skeleton className="h-64" />
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-xs text-muted">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg md:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
