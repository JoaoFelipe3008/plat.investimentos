import type { Unit } from "./types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function formatBRL(v: number | null | undefined, opts?: { compact?: boolean }) {
  if (v == null || !Number.isFinite(v)) return "—";
  return opts?.compact ? brlCompact.format(v) : brl.format(v);
}

export function formatMoney(v: number | null | undefined, unit: Unit) {
  if (v == null || !Number.isFinite(v)) return "—";
  if (unit === "USD") return usd.format(v);
  if (unit === "PCT") return `${num.format(v)}%`;
  if (unit === "PTS") return `${num.format(v)} pts`;
  if (Math.abs(v) < 1 && v !== 0) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 4 }).format(v);
  }
  return brl.format(v);
}

export function formatNumber(v: number | null | undefined, digits = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(v);
}

export function formatCompact(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "—";
  return compact.format(v);
}

export function formatPct(v: number | null | undefined, opts?: { signed?: boolean; digits?: number }) {
  if (v == null || !Number.isFinite(v)) return "—";
  const digits = opts?.digits ?? 2;
  const s = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(v));
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${opts?.signed === false ? (v < 0 ? "−" : "") : sign}${s}%`;
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

export function trendClass(v: number | null | undefined) {
  if (v == null || v === 0) return "text-muted";
  return v > 0 ? "text-up" : "text-down";
}

/** "dd/mm/aaaa" (formato do BCB) → ISO yyyy-mm-dd */
export function bcbDateToISO(d: string) {
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
