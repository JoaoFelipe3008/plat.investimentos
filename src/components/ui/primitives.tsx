import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { forwardRef } from "react";
import { formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "up" | "down" | "outline" | "warn";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-[5px] px-1.5 text-2xs font-medium whitespace-nowrap",
        tone === "neutral" && "bg-elevated text-muted",
        tone === "up" && "bg-up/10 text-up",
        tone === "down" && "bg-down/10 text-down",
        tone === "outline" && "border border-line-strong text-muted",
        tone === "warn" && "bg-[#f5b74e]/10 text-[#f5b74e]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} />;
}

const field =
  "h-9 w-full rounded-md border border-line bg-bg px-3 text-sm text-fg placeholder:text-subtle transition-colors hover:border-line-strong focus:border-fg/40 focus:outline-none";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(field, "num", className)} {...props} />
));
Input.displayName = "Input";

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2398A2B3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, style, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(field, "appearance-none bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8", className)}
    style={{ backgroundImage: chevron, ...style }}
    {...props}
  />
));
Select.displayName = "Select";

export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="block text-2xs leading-snug text-subtle">{hint}</span>}
    </label>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <div className="mb-3 grid size-10 place-items-center rounded-lg border border-line bg-elevated text-muted">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Change({ value, className, pill = false }: { value: number | null | undefined; className?: string; pill?: boolean }) {
  if (value == null || !Number.isFinite(value)) return <span className={cn("num text-subtle", className)}>—</span>;
  const up = value > 0;
  const down = value < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-0.5 font-medium",
        up ? "text-up" : down ? "text-down" : "text-muted",
        pill && "rounded-[5px] px-1.5 py-0.5 text-xs",
        pill && (up ? "bg-up/10" : down ? "bg-down/10" : "bg-elevated"),
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      <span>{formatPct(value, { signed: false })}</span>
      <span className="sr-only">{up ? "alta" : down ? "queda" : "estável"}</span>
    </span>
  );
}

export function Stat({ label, value, sub, className }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className="num mt-1 truncate text-[15px] font-medium text-fg">{value}</p>
      {sub && <div className="mt-0.5 text-xs">{sub}</div>}
    </div>
  );
}

export function Disclaimer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-2xs leading-relaxed text-subtle", className)}>{children}</p>;
}
