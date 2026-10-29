import {
  BellRing,
  BookOpen,
  Calculator,
  Compass,
  LayoutGrid,
  LineChart,
  Newspaper,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon; group: "principal" | "ferramentas" | "conta" }[] = [
  { href: "/", label: "Visão geral", icon: LayoutGrid, group: "principal" },
  { href: "/guia", label: "Meu guia", icon: BookOpen, group: "principal" },
  { href: "/explorar", label: "Explorar investimentos", icon: Compass, group: "principal" },
  { href: "/mercado", label: "Mercado", icon: LineChart, group: "principal" },
  { href: "/noticias", label: "Notícias", icon: Newspaper, group: "principal" },
  { href: "/simulador", label: "Simulador", icon: Calculator, group: "ferramentas" },
  { href: "/carteira", label: "Minha carteira", icon: Wallet, group: "ferramentas" },
  { href: "/alertas", label: "Alertas", icon: BellRing, group: "ferramentas" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, group: "conta" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
