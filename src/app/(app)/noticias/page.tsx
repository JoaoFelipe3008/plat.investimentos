"use client";

import { Newspaper, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { NewsRow } from "@/components/market";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented, SourceTag } from "@/components/ui/interactive";
import { Badge, EmptyState, Input, Skeleton } from "@/components/ui/primitives";
import { useNews } from "@/hooks/use-market";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { NewsCategory } from "@/lib/types";
import { normalize } from "@/lib/utils";

const CATS: { value: "todas" | NewsCategory | "favoritos"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "brasil", label: "Brasil" },
  { value: "economia", label: "Economia" },
  { value: "juros", label: "Juros e inflação" },
  { value: "empresas", label: "Empresas" },
  { value: "cripto", label: "Cripto" },
  { value: "internacional", label: "Internacional" },
  { value: "favoritos", label: "Meus favoritos" },
];

export default function NewsPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useNews();
  const favorites = useApp((s) => s.favorites);
  const [cat, setCat] = useState<(typeof CATS)[number]["value"]>("todas");
  const [sort, setSort] = useState<"recentes" | "relevancia">("recentes");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    let list = data?.items ?? [];
    if (cat === "favoritos") list = list.filter((n) => n.related.some((r) => favorites.includes(r)));
    else if (cat !== "todas") list = list.filter((n) => n.categories.includes(cat));
    if (q.trim()) {
      const nq = normalize(q.trim());
      list = list.filter((n) => normalize(`${n.title} ${n.summary} ${n.related.join(" ")}`).includes(nq));
    }
    return sort === "relevancia" ? [...list].sort((a, b) => b.relevance - a.relevance) : list;
  }, [data, cat, q, sort, favorites]);

  return (
    <>
      <PageHeader
        title="Notícias"
        description="Manchetes de fontes reais, com link para a matéria original. O resumo é um trecho do próprio texto, sem reescrita."
        actions={
          <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Atualizar
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Segmented value={cat} onChange={setCat} options={CATS} label="Categoria" />
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Filtrar por palavra ou ativo" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-full sm:w-64" />
          <Segmented
            value={sort}
            onChange={setSort}
            label="Ordenação"
            options={[
              { value: "recentes", label: "Recentes" },
              { value: "relevancia", label: "Relevância" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          {isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : !items.length ? (
            <EmptyState
              icon={Newspaper}
              title="Nenhuma notícia neste filtro"
              description={
                cat === "cripto" || cat === "internacional"
                  ? "Para mais cobertura internacional e de cripto, configure o provedor Finnhub (FINNHUB_API_KEY)."
                  : cat === "favoritos"
                    ? "Nenhuma notícia recente menciona seus ativos favoritos."
                    : "Tente outra categoria ou termo."
              }
            />
          ) : (
            items.slice(0, 60).map((n) => <NewsRow key={n.id} item={n} />)
          )}
        </Card>

        <aside className="space-y-4">
          <Card delay={0.04} className="p-5">
            <p className="text-[13px] font-medium">Fontes</p>
            <ul className="mt-3 space-y-3">
              {data?.providers.map((p) => (
                <li key={p.name} className="text-[13px]">
                  <div className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <Badge tone={p.status === "ok" ? "up" : p.status === "error" ? "down" : "neutral"}>
                      {p.status === "ok" ? "Conectado" : p.status === "error" ? "Erro" : "Não configurado"}
                    </Badge>
                  </div>
                  {p.detail && <p className="mt-1 text-xs text-subtle">{p.detail}</p>}
                </li>
              ))}
            </ul>
            {data && (
              <div className="mt-4 border-t border-line pt-3">
                <SourceTag source="Atualização automática a cada 10 min" asOf={new Date(dataUpdatedAt).toISOString()} status="live" />
                <p className="mt-2 text-2xs text-subtle">Última consulta {timeAgo(new Date(dataUpdatedAt).toISOString())}.</p>
              </div>
            )}
          </Card>
          <Card delay={0.06} className="p-5">
            <p className="text-[13px] font-medium">Como lemos as notícias</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
              <li>Categorias e ativos relacionados são identificados por palavras-chave no título e no trecho — podem conter imprecisões.</li>
              <li>A relevância combina menções a juros, empresas e ativos acompanhados com a data de publicação.</li>
              <li>Conteúdo da Agência Brasil publicado sob licença Creative Commons, com atribuição à fonte.</li>
              <li>Notícias não são recomendação de investimento.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
