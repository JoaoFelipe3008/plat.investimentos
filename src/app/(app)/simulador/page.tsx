"use client";

import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MultiLineChart } from "@/components/charts/charts";
import { PageHeader } from "@/components/shell/app-shell";
import { Term } from "@/components/term";
import { Card, CardHeader } from "@/components/ui/card";
import { AnimatedNumber, Segmented, Switch, Tooltip } from "@/components/ui/interactive";
import { Field, Input } from "@/components/ui/primitives";
import { useMacro } from "@/hooks/use-market";
import { simulate, type SimInput } from "@/lib/finance/simulator";
import { formatBRL, formatNumber } from "@/lib/format";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type ScenarioId = "conservador" | "intermediario" | "arrojado";

const SCENARIOS: Record<ScenarioId, { label: string; spread: number; color: string; description: string }> = {
  conservador: { label: "Conservador", spread: 0, color: "#98A2B3", description: "Taxa próxima ao CDI atual, típica de renda fixa pós-fixada." },
  intermediario: { label: "Intermediário", spread: 2, color: "#D8DEE6", description: "Alguns pontos acima do CDI, com mais oscilação no caminho." },
  arrojado: { label: "Maior risco", spread: 4, color: "#F5F7FA", description: "Hipótese otimista, com chance real de resultados bem inferiores." },
};

function num(s: string) {
  // Aceita "1.000,50" (pt-BR) e "1000.5".
  const v = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(v) ? v : 0;
}

export default function SimulatorPage() {
  const profile = useApp((s) => s.profile);
  const macro = useMacro();
  const cdi = macro.data?.cdi.price ?? null;
  const ipca = macro.data?.focus.ipca ?? macro.data?.ipca12m.price ?? null;

  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState(String(profile?.monthly ?? 300));
  const [years, setYears] = useState("10");
  const [rate, setRate] = useState("10");
  const [inflation, setInflation] = useState("4,5");
  const [fee, setFee] = useState("0,2");
  const [ir, setIr] = useState(true);
  const [view, setView] = useState<"nominal" | "real">("real");
  const [touched, setTouched] = useState(false);

  // Pré-preenche com dados reais do BCB como referência, enquanto o usuário não editar.
  useEffect(() => {
    if (touched) return;
    if (cdi != null) setRate(formatNumber(cdi, 2));
    if (ipca != null) setInflation(formatNumber(ipca, 2));
  }, [cdi, ipca, touched]);

  const base: SimInput = { initial: num(initial), monthly: num(monthly), years: Math.min(60, Math.max(1, num(years))), annualRate: num(rate), inflation: num(inflation), annualFee: num(fee), applyIR: ir };

  const results = useMemo(() => {
    const out = {} as Record<ScenarioId, ReturnType<typeof simulate>>;
    for (const id of Object.keys(SCENARIOS) as ScenarioId[]) out[id] = simulate({ ...base, annualRate: base.annualRate + SCENARIOS[id].spread });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.initial, base.monthly, base.years, base.annualRate, base.inflation, base.annualFee, base.applyIR]);

  const main = results.conservador;
  const step = Math.max(1, Math.floor(main.points.length / 120));
  const chart = main.points
    .filter((_, i) => i % step === 0 || i === main.points.length - 1)
    .map((p) => {
      const row: Record<string, number> = { x: p.month, investido: p.invested };
      for (const id of Object.keys(SCENARIOS) as ScenarioId[]) {
        const pt = results[id].points[p.month];
        row[id] = view === "real" ? pt.real : pt.nominal;
      }
      return row;
    });

  const set = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(true);
    fn(e.target.value);
  };

  return (
    <>
      <PageHeader
        title="Simulador"
        description="Projete cenários hipotéticos com aportes, prazo, inflação, custos e impostos. Serve para entender o efeito do tempo e das taxas, não para prever resultados."
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="p-5">
          <div className="space-y-4">
            <Field label="Investimento inicial (R$)"><Input inputMode="decimal" value={initial} onChange={set(setInitial)} /></Field>
            <Field label="Aporte mensal (R$)"><Input inputMode="decimal" value={monthly} onChange={set(setMonthly)} /></Field>
            <Field label="Prazo (anos)"><Input inputMode="numeric" value={years} onChange={set(setYears)} /></Field>
            <Field
              label="Rentabilidade hipotética base (% a.a.)"
              hint={cdi != null ? `Pré-preenchida com o CDI atual (${formatNumber(cdi, 2)}% a.a., BCB). Juros podem mudar ao longo do prazo.` : "Informe uma taxa anual."}
            >
              <Input inputMode="decimal" value={rate} onChange={set(setRate)} />
            </Field>
            <Field
              label="Inflação estimada (% a.a.)"
              hint={macro.data?.focus.ipca != null ? `Mediana do Focus para ${macro.data.focus.year}: ${formatNumber(macro.data.focus.ipca, 2)}%.` : undefined}
            >
              <Input inputMode="decimal" value={inflation} onChange={set(setInflation)} />
            </Field>
            <Field label="Taxas anuais (% a.a.)" hint="Custódia, administração etc.">
              <Input inputMode="decimal" value={fee} onChange={set(setFee)} />
            </Field>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-[13px]">Imposto de Renda</span>
                <span className="block text-2xs text-subtle">Tabela regressiva da renda fixa no resgate</span>
              </span>
              <Switch checked={ir} onCheckedChange={setIr} aria-label="Aplicar Imposto de Renda" />
            </label>
          </div>
        </Card>

        <div className="space-y-4">
          <Card delay={0.04} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted">Patrimônio projetado · cenário conservador · {view === "real" ? "em valores de hoje" : "valor nominal"}</p>
                <p className="num mt-1 text-[32px] font-semibold tracking-[-0.02em]">
                  <AnimatedNumber value={view === "real" ? main.netReal : main.netNominal} format={(v) => formatBRL(v)} />
                </p>
              </div>
              <Segmented
                value={view}
                onChange={setView}
                label="Tipo de valor"
                options={[
                  { value: "real", label: "Ajustado pela inflação" },
                  { value: "nominal", label: "Nominal" },
                ]}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
              <Metric label="Total investido" value={main.invested} />
              <Metric label="Rendimentos líquidos" value={main.earnings} />
              <Metric label="IR estimado" value={main.tax} />
              <Metric label="Valor nominal" value={main.netNominal} />
            </div>
          </Card>

          <Card delay={0.06}>
            <CardHeader title="Evolução por cenário" description={view === "real" ? <>Valores descontada a <Term id="ipca">inflação</Term> estimada</> : "Valores nominais, sem descontar a inflação"} />
            <div className="px-3 pb-4 sm:px-5">
              <MultiLineChart
                data={chart}
                height={300}
                format={(v) => formatBRL(v, { compact: true })}
                xFormat={(m) => (m < 12 ? `${m}m` : `${formatNumber(m / 12, m % 12 ? 1 : 0)}a`)}
                lines={[
                  { key: "investido", label: "Investido", color: "#667085", dashed: true },
                  ...(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => ({ key: id, label: SCENARIOS[id].label, color: SCENARIOS[id].color })),
                ]}
              />
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(SCENARIOS) as ScenarioId[]).map((id, i) => {
              const r = results[id];
              const s = SCENARIOS[id];
              return (
                <Card key={id} delay={0.08 + i * 0.03} className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-0.5 w-4 rounded" style={{ background: s.color }} />
                    <p className="text-[13px] font-medium">{s.label}</p>
                    <span className="num ml-auto text-xs text-muted">{formatNumber(base.annualRate + s.spread, 2)}% a.a.</span>
                  </div>
                  <p className="num mt-3 text-lg font-semibold">{formatBRL(view === "real" ? r.netReal : r.netNominal)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.description}</p>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-3 rounded-lg border border-line px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-muted" />
            <p className={cn("text-xs leading-relaxed text-muted")}>
              Simulação hipotética com taxa constante e capitalização mensal. Investimentos reais variam: juros mudam, ativos de risco oscilam e podem ter perdas.
              O IR é aproximado pela alíquota do prazo total. Não é promessa nem recomendação.{" "}
              <Tooltip content="Os cenários somam 0, 2 e 4 pontos percentuais à taxa base apenas para ilustrar a sensibilidade ao retorno.">
                <span className="cursor-help underline decoration-dotted underline-offset-2">Como os cenários são definidos</span>
              </Tooltip>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="num mt-1 text-[15px] font-medium">{formatBRL(value)}</p>
    </div>
  );
}
