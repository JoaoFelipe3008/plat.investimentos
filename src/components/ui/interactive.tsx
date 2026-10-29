"use client";

import * as D from "@radix-ui/react-dialog";
import * as Sl from "@radix-ui/react-slider";
import * as Sw from "@radix-ui/react-switch";
import * as T from "@radix-ui/react-tooltip";
import { Clock, Info, X } from "lucide-react";
import { animate, AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { formatDateTime } from "@/lib/format";
import type { QuoteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <T.Root delayDuration={200}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            "z-50 max-w-[300px] rounded-md border border-line-strong bg-elevated px-3 py-2 text-xs leading-relaxed text-fg shadow-xl shadow-black/40",
            className,
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </D.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
              <D.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "pointer-events-auto max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line-strong bg-surface p-5 shadow-2xl shadow-black/60",
                    className,
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <D.Title className="text-[15px] font-semibold">{title}</D.Title>
                      <D.Description className={description ? "mt-1 text-[13px] text-muted" : "sr-only"}>
                        {description ?? title}
                      </D.Description>
                    </div>
                    <D.Close className="rounded-md p-1 text-muted hover:bg-elevated hover:text-fg" aria-label="Fechar">
                      <X className="size-4" />
                    </D.Close>
                  </div>
                  {children}
                </motion.div>
              </D.Content>
            </div>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-md border border-line bg-bg p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-[5px] font-medium whitespace-nowrap transition-colors",
              size === "sm" ? "h-6 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[5px] bg-elevated shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
                transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ className, ...props }: React.ComponentProps<typeof Sw.Root>) {
  return (
    <Sw.Root
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-line-strong bg-elevated transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-fg disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <Sw.Thumb className="block size-3.5 translate-x-[3px] rounded-full bg-muted transition-transform duration-200 data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-bg" />
    </Sw.Root>
  );
}

export function Slider({ className, ...props }: React.ComponentProps<typeof Sl.Root>) {
  return (
    <Sl.Root className={cn("relative flex h-5 w-full touch-none select-none items-center", className)} {...props}>
      <Sl.Track className="relative h-1 grow overflow-hidden rounded-full bg-elevated">
        <Sl.Range className="absolute h-full bg-fg/80" />
      </Sl.Track>
      {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
        <Sl.Thumb
          key={i}
          aria-label={props["aria-label"]}
          className="block size-4 rounded-full border-2 border-bg bg-fg shadow transition-transform hover:scale-110 focus-visible:scale-110"
        />
      ))}
    </Sl.Root>
  );
}

/** Interpola suavemente entre valores. Respeita redução de movimento. */
export function AnimatedNumber({ value, format, className }: { value: number; format: (v: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || prev.current === value) {
      el.textContent = format(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = format(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, format, reduce]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

const STATUS: Record<QuoteStatus, { label: string; dot: string }> = {
  live: { label: "Atualizado", dot: "bg-up" },
  delayed: { label: "Publicação com atraso", dot: "bg-[#f5b74e]" },
  stale: { label: "Último valor em cache", dot: "bg-[#f5b74e]" },
  unavailable: { label: "Indisponível", dot: "bg-subtle" },
};

/** Fonte, horário de referência e situação do dado — obrigatório junto de qualquer valor de mercado. */
export function SourceTag({
  source,
  asOf,
  status,
  note,
  className,
}: {
  source: string;
  asOf?: string | null;
  status: QuoteStatus;
  note?: string;
  className?: string;
}) {
  const s = STATUS[status];
  return (
    <Tooltip
      content={
        <div className="space-y-1">
          <p>
            <span className="text-muted">Fonte:</span> {source}
          </p>
          {asOf && (
            <p>
              <span className="text-muted">Referência:</span> {formatDateTime(asOf)}
            </p>
          )}
          <p>
            <span className="text-muted">Situação:</span> {s.label}
          </p>
          {note && <p className="text-muted">{note}</p>}
        </div>
      }
    >
      <button type="button" className={cn("inline-flex min-w-0 items-center gap-1.5 text-2xs text-subtle hover:text-muted", className)}>
        <span className={cn("size-1.5 shrink-0 rounded-full", s.dot)} aria-hidden />
        <span className="truncate">{source}</span>
        {asOf ? (
          <>
            <Clock className="size-3 shrink-0" aria-hidden />
            <span className="num whitespace-nowrap">{formatDateTime(asOf)}</span>
          </>
        ) : (
          <Info className="size-3 shrink-0" aria-hidden />
        )}
        <span className="sr-only">{s.label}</span>
      </button>
    </Tooltip>
  );
}
