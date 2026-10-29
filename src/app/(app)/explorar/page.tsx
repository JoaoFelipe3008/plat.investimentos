"use client";

import { useQueries } from "@tanstack/react-query";
import { Columns3, Search, Star, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FavoriteButton, formatAssetValue, QuoteChange } from "@/components/market";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented, SourceTag } from "@/components/ui/interactive";
import { Badge, Change, EmptyState, Input, Skeleton } from "@/components/ui/primitives";
import { ASSETS, CATEGORY_LABEL, EXPLORE_CATEGORIES, getAsset, type Asset } from "@/data/assets";
import { useQuotes } from "@/hooks/use-market";
import { useApp } from "@/lib/store";
import type { AssetCategory, History } from "@/lib/types";
import { cn, normalize } from "@/lib/utils";

type Cat = "todos" | AssetCategory;

const RISK_LEVEL: Record<string, { label: string; level: number }> = {
  tesouro: { label: "Baixo a moderado", level: 1 },
  "renda-fixa": { label: "Baixo", level: 1 },
  fii: { label: "Moderado", level: 2 },
  etf: { label: "Moderado a alto", level: 3 },
  "acoes-br": { label: "Alto", level: 3 },
  "acoes-int": { label: "Alto + câmbio", level: 3 },
  cripto: { label: "Muito alto", level: 4 },
};

export default function ExplorePage() {
  const [cat, setCat] = useState<Cat>("todos");
  const [q, setQ] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const favorites = useApp((s) => s.favorites);

  const list = useMemo(() => {
    const nq = normalize(q.trim());
    return ASSETS.filter((a) => EXPLORE_CATEGORIES.includes(a.category))
      .filter((a) => cat === "todos" || a.category === cat)
      .filter((a) => !onlyFav || favorites.includes(a.symbol))
      .filter((a) => !nq || normalize(`${a.symbol} ${a.name} ${a.description} ${a.sector ?? ""} ${a.keywords.join(" ")}`).includes(nq));
  }, [cat, q, onlyFav, favorites]);

  const { data: quotes, isLoading } = useQuotes(list.map((a) => a.symbol));

  const toggleCompare = (s: string) =>
    setCompare((c) => (c.includes(s) ? c.filter((x) => x !== s) : c.length >= 3 ? c : [...c, s]));

  return (
    <>
      <PageHeader
        title="Explorar investimentos"
        description="Conheça cada classe de ativo, seus riscos e características. Selecione até 3 para comparar lado a lado."
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input placeholder="Buscar por nome, código, setor…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Button variant={onlyFav ? "outline" : "ghost"} size="sm" onClick={() => setOnlyFav((v) => !v)} aria-pressed={onlyFav}>
            <Star className={cn(onlyFav && "fill-fg")} /> Somente favoritos
          </Button>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Segmented
            value={cat}
            onChange={setCat}
            label="Categoria"
            options={[{ value: "todos" as Cat, label: "Todos" }, ...EXPLORE_CATEGORIES.map((c) => ({ value: c as Cat, label: CATEGORY_LABEL[c] }))]}
          />
        </div>
      </div>

      {compare.length > 0 && <ComparePanel symbols={compare} onRemove={toggleCompare} onClear={() => setCompare([])} />}

      {!list.length ? (
        <Card>
          <EmptyState icon={Search} title="Nenhum ativo encontrado" description="Ajuste a busca ou os filtros." />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a, i) => {
            const qq = quotes?.[a.symbol];
            const selected = compare.includes(a.symbol);
            return (
              <Card key={a.symbol} delay={Math.min(i, 12) * 0.02} className={cn("flex flex-col transition-colors hover:border-line-strong", selected && "border-fg/40")}>
                <Link href={`/explorar/${a.symbol}`} className="flex-1 px-5 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="num text-[13px] font-semibold">{a.symbol.replace("-", " ")}</p>
                      <p className="truncate text-xs text-muted">{a.name}</p>
                    </div>
                    <Badge>{CATEGORY_LABEL[a.category]}</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    {isLoading && !qq ? (
                      <Skeleton className="h-5 w-24" />
                    ) : a.provider.kind === "benchmark" ? (
                      <span className="text-[13px] text-muted">
                        Referência: {a.provider.of} <span className="num text-fg">{qq?.price != null ? formatAssetValue(getAsset(a.provider.of), qq.price) : "—"}</span>
                      </span>
                    ) : (
                      <>
                        <span className={cn("num text-[15px] font-medium", qq?.price == null && "text-[13px] font-normal text-subtle")}>
                          {qq?.price == null ? "Cotação indisponível" : formatAssetValue(a, qq.price)}
                        </span>
                        {qq?.price != null && <QuoteChange asset={a} quote={qq} />}
                      </>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{a.description}</p>
                </Link>
                <div className="mt-3 flex items-center justify-between border-t border-line px-3 py-1.5">
                  <span className="px-2 text-2xs text-subtle">Risco: {RISK_LEVEL[a.category]?.label}</span>
                  <div className="flex items-center">
                    <FavoriteButton symbol={a.symbol} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCompare(a.symbol)}
                      aria-pressed={selected}
                      disabled={!selected && compare.length >= 3}
                      className={cn(selected && "text-fg")}
                    >
                      <Columns3 /> {selected ? "Comparando" : "Comparar"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-6 text-2xs text-subtle">Cotações e indicadores são informativos. Rentabilidade passada não garante resultados futuros. Nada aqui é recomendação.</p>
    </>
  );
}

function ComparePanel({ symbols, onRemove, onClear }: { symbols: string[]; onRemove: (s: string) => void; onClear: () => void }) {
  const assets = symbols.map((s) => getAsset(s)!) as Asset[];
  const { data: quotes } = useQuotes(symbols);
  const histories = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["history", s, "1a"],
      queryFn: async () => (await fetch(`/api/market/history?symbol=${s}&range=1a`)).json() as Promise<History>,
      staleTime: 5 * 60_000,
    })),
  });

  const rows: { label: string; render: (a: Asset, i: number) => React.ReactNode }[] = [
    { label: "Categoria", render: (a) => CATEGORY_LABEL[a.category] },
    {
      label: "Preço / referência",
      render: (a) => {
        const q = quotes?.[a.symbol];
        const ref = a.provider.kind === "benchmark" ? getAsset(a.provider.of) : a;
        return <span className="num">{q?.price == null ? "—" : formatAssetValue(ref, q.price)}</span>;
      },
    },
    { label: "Variação recente", render: (a) => (a.provider.kind === "benchmark" ? <span className="text-subtle">—</span> : <QuoteChange asset={a} quote={quotes?.[a.symbol]} />) },
    {
      label: "Variação em 12 meses",
      render: (a, i) => {
        const h = histories[i]?.data;
        if (a.unit === "PCT" || a.provider.kind === "benchmark") return <span className="text-subtle">Não se aplica</span>;
        if (!h || h.points.length < 2) return <span className="text-subtle">{histories[i]?.isLoading ? "…" : "Indisponível"}</span>;
        return <Change value={(h.points.at(-1)!.v / h.points[0].v - 1) * 100} />;
      },
    },
    { label: "Nível de risco", render: (a) => RISK_LEVEL[a.category]?.label },
    ...["Liquidez", "Garantia", "Imposto de Renda"].map((label) => ({
      label,
      render: (a: Asset) => <span className="text-muted">{a.facts?.find((f) => f.label === label || f.label === "IR")?.value ?? "—"}</span>,
    })),
    { label: "Principais riscos", render: (a) => <ul className="list-disc space-y-1 pl-4 text-muted">{a.risks.slice(0, 2).map((r) => <li key={r}>{r}</li>)}</ul> },
    {
      label: "Fonte",
      render: (a) => {
        const q = quotes?.[a.symbol];
        return q ? <SourceTag source={q.source} asOf={q.asOf} status={q.status} note={q.reason} /> : null;
      },
    },
  ];

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-[13px] font-medium">Comparação lado a lado</p>
        <Button variant="ghost" size="sm" onClick={onClear}>Limpar</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th className="w-44 px-5 py-3 text-left text-2xs font-medium uppercase tracking-[0.05em] text-subtle">Atributo</th>
              {assets.map((a) => (
                <th key={a.symbol} className="px-4 py-3 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/explorar/${a.symbol}`} className="hover:underline">
                      <p className="num font-semibold">{a.symbol}</p>
                      <p className="text-xs font-normal text-muted">{a.name}</p>
                    </Link>
                    <button onClick={() => onRemove(a.symbol)} className="rounded p-1 text-subtle hover:bg-elevated hover:text-fg" aria-label={`Remover ${a.symbol} da comparação`}>
                      <X className="size-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line last:border-0">
                <td className="px-5 py-3 text-xs text-muted">{r.label}</td>
                {assets.map((a, i) => (
                  <td key={a.symbol} className="px-4 py-3 align-top text-xs leading-relaxed">{r.render(a, i)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
