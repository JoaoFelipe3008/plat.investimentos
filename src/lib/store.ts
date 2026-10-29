"use client";

import { useEffect as useEffectSafe, useState as useStateSafe } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { uid } from "./utils";

/**
 * Estado do usuário. Em "modo local" fica apenas no navegador (localStorage).
 * Com Supabase configurado e usuário autenticado, src/lib/supabase/sync.ts
 * espelha estas coleções nas tabelas com RLS (ver supabase/schema.sql).
 */

export type Knowledge = "nenhum" | "basico" | "intermediario";
export type Goal = "reserva" | "curto" | "aposentadoria" | "patrimonio" | "aprender";
export type Horizon = "ate1" | "1a5" | "mais5";
export type LossReaction = "vende" | "espera" | "compra";

export interface Profile {
  name: string;
  knowledge: Knowledge;
  goal: Goal;
  monthly: number;
  horizon: Horizon;
  lossReaction: LossReaction;
  hasReserve: boolean;
  completedAt: string;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: "compra" | "venda";
  quantity: number;
  price: number;
  fees: number;
  date: string;
  note?: string;
  example?: boolean;
}

export interface Income {
  id: string;
  symbol: string;
  kind: "dividendo" | "jcp" | "rendimento";
  amount: number;
  date: string;
  example?: boolean;
}

export type AlertKind = "preco_acima" | "preco_abaixo" | "variacao" | "noticia" | "selic";

export interface Alert {
  id: string;
  kind: AlertKind;
  symbol?: string;
  threshold?: number;
  channels: { app: boolean; push: boolean; email: boolean };
  frequency: "uma_vez" | "diario" | "sempre";
  quietStart?: string;
  quietEnd?: string;
  active: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface AppNotification {
  id: string;
  alertId?: string;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  at: string;
  value: number | null;
  detail: string;
}

export interface Snapshot {
  date: string;
  value: number;
  invested: number;
}

export const DASHBOARD_WIDGETS = {
  patrimonio: "Patrimônio e evolução",
  alocacao: "Distribuição por classe",
  indices: "Principais indicadores",
  favoritos: "Ativos favoritos",
  noticias: "Notícias relevantes",
  alertas: "Alertas recentes",
  licoes: "Próximas lições",
} as const;
export type WidgetId = keyof typeof DASHBOARD_WIDGETS;

interface State {
  profile: Profile | null;
  favorites: string[];
  lessons: Record<string, { completedAt: string; score: number }>;
  transactions: Transaction[];
  incomes: Income[];
  alerts: Alert[];
  notifications: AppNotification[];
  alertLog: AlertEvent[];
  snapshots: Snapshot[];
  seen: { selic?: number; newsIds: string[] };
  settings: {
    hideValues: boolean;
    motion: "sistema" | "reduzido";
    widgets: Record<WidgetId, boolean>;
  };

  setProfile: (p: Profile) => void;
  toggleFavorite: (symbol: string) => void;
  completeLesson: (id: string, score: number) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
  addIncome: (i: Omit<Income, "id">) => void;
  removeIncome: (id: string) => void;
  loadExamplePortfolio: () => void;
  clearExamples: () => void;
  addAlert: (a: Omit<Alert, "id" | "createdAt" | "active">) => void;
  updateAlert: (id: string, patch: Partial<Alert>) => void;
  removeAlert: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  logAlert: (e: Omit<AlertEvent, "id" | "at">) => void;
  markRead: (id: string | "all") => void;
  removeNotification: (id: string) => void;
  recordSnapshot: (s: Snapshot) => void;
  setSeen: (patch: Partial<State["seen"]>) => void;
  setSetting: <K extends keyof State["settings"]>(k: K, v: State["settings"][K]) => void;
  toggleWidget: (id: WidgetId) => void;
  resetAll: () => void;
  hydrateFromRemote: (data: Partial<Pick<State, "profile" | "favorites" | "lessons" | "transactions" | "incomes" | "alerts" | "notifications">>) => void;
}

const initial = {
  profile: null,
  favorites: ["BTC", "PETR4", "IBOV"],
  lessons: {},
  transactions: [],
  incomes: [],
  alerts: [],
  notifications: [],
  alertLog: [],
  snapshots: [],
  seen: { newsIds: [] },
  settings: {
    hideValues: false,
    motion: "sistema" as const,
    widgets: { patrimonio: true, alocacao: true, indices: true, favoritos: true, noticias: true, alertas: true, licoes: true },
  },
};

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

export const useApp = create<State>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (profile) => set({ profile }),
      toggleFavorite: (symbol) =>
        set((s) => ({
          favorites: s.favorites.includes(symbol) ? s.favorites.filter((f) => f !== symbol) : [...s.favorites, symbol],
        })),
      completeLesson: (id, score) =>
        set((s) => ({ lessons: { ...s.lessons, [id]: { completedAt: new Date().toISOString(), score } } })),
      addTransaction: (t) => set((s) => ({ transactions: [...s.transactions, { ...t, id: uid() }] })),
      removeTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addIncome: (i) => set((s) => ({ incomes: [...s.incomes, { ...i, id: uid() }] })),
      removeIncome: (id) => set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) })),
      // Carteira de EXEMPLO para explorar a interface. Quantidades e preços de compra são fictícios
      // e ficam marcados como exemplo; o valor atual usa cotações reais quando disponíveis.
      loadExamplePortfolio: () =>
        set((s) => ({
          transactions: [
            ...s.transactions.filter((t) => !t.example),
            { id: uid(), symbol: "TESOURO-SELIC", type: "compra", quantity: 1, price: 3000, fees: 0, date: daysAgo(160), example: true },
            { id: uid(), symbol: "CDB", type: "compra", quantity: 1, price: 1500, fees: 0, date: daysAgo(120), example: true },
            { id: uid(), symbol: "PETR4", type: "compra", quantity: 20, price: 36, fees: 0, date: daysAgo(150), example: true },
            { id: uid(), symbol: "VALE3", type: "compra", quantity: 10, price: 60, fees: 0, date: daysAgo(90), example: true },
            { id: uid(), symbol: "ITUB4", type: "compra", quantity: 15, price: 33, fees: 0, date: daysAgo(60), example: true },
            { id: uid(), symbol: "BTC", type: "compra", quantity: 0.002, price: 380000, fees: 0, date: daysAgo(45), example: true },
          ],
          incomes: [
            ...s.incomes.filter((i) => !i.example),
            { id: uid(), symbol: "PETR4", kind: "dividendo", amount: 28.4, date: daysAgo(30), example: true },
            { id: uid(), symbol: "ITUB4", kind: "jcp", amount: 4.1, date: daysAgo(12), example: true },
          ],
        })),
      clearExamples: () =>
        set((s) => ({
          transactions: s.transactions.filter((t) => !t.example),
          incomes: s.incomes.filter((i) => !i.example),
          snapshots: [],
        })),
      addAlert: (a) =>
        set((s) => ({ alerts: [{ ...a, id: uid(), createdAt: new Date().toISOString(), active: true }, ...s.alerts] })),
      updateAlert: (id, patch) => set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      pushNotification: (n) =>
        set((s) => ({
          notifications: [{ ...n, id: uid(), createdAt: new Date().toISOString(), read: false }, ...s.notifications].slice(0, 200),
        })),
      logAlert: (e) => set((s) => ({ alertLog: [{ ...e, id: uid(), at: new Date().toISOString() }, ...s.alertLog].slice(0, 500) })),
      markRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (id === "all" || n.id === id ? { ...n, read: true } : n)) })),
      removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      recordSnapshot: (snap) =>
        set((s) => ({ snapshots: [...s.snapshots.filter((x) => x.date !== snap.date), snap].sort((a, b) => a.date.localeCompare(b.date)).slice(-730) })),
      setSeen: (patch) => set((s) => ({ seen: { ...s.seen, ...patch } })),
      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      toggleWidget: (id) =>
        set((s) => ({ settings: { ...s.settings, widgets: { ...s.settings.widgets, [id]: !s.settings.widgets[id] } } })),
      resetAll: () => set({ ...initial }),
      hydrateFromRemote: (data) => set((s) => ({ ...s, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null)) })),
    }),
    {
      name: "lastro:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        favorites: s.favorites,
        lessons: s.lessons,
        transactions: s.transactions,
        incomes: s.incomes,
        alerts: s.alerts,
        notifications: s.notifications,
        alertLog: s.alertLog,
        snapshots: s.snapshots,
        seen: s.seen,
        settings: s.settings,
      }),
    },
  ),
);

/** true depois que o estado persistido foi carregado do navegador (evita flash de conteúdo). */
export function useHydrated() {
  const [h, setH] = useStateSafe(false);
  useEffectSafe(() => {
    if (useApp.persist.hasHydrated()) setH(true);
    return useApp.persist.onFinishHydration(() => setH(true));
  }, []);
  return h;
}

