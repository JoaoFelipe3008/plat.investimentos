"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { WidgetKind } from "@/data/lessons";
import { irRate, simulate } from "@/lib/finance/simulator";
import { formatBRL, formatNumber } from "@/lib/format";
import { MultiLineChart, TimeAreaChart } from "./charts/charts";
import { Button } from "./ui/button";
import { Segmented, Slider } from "./ui/interactive";
import { Field, Input } from "./ui/primitives";

function Control({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="num font-medium text-fg">{value}</span>
      </div>
      {children}
    </div>
  );
}

function Frame({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mt-4 rounded-lg border border-line bg-bg p-4">
      {children}
      <p className="mt-3 text-2xs text-subtle">{note ?? "Exemplo educacional com valores hipotéticos. Não representa promessa de rentabilidade."}</p>
    </div>
  );
}

function Compound() {
  const [monthly, setMonthly] = useState(300);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(20);
  const r = useMemo(() => simulate({ initial: 0, monthly, years, annualRate: rate, inflation: 0, annualFee: 0, applyIR: false }), [monthly, rate, years]);
  const data = r.points.filter((_, i) => i % 3 === 0 || i === r.points.length - 1).map((p) => ({ x: p.month / 12, investido: p.invested, total: p.nominal }));
  const share = r.grossNominal ? ((r.grossNominal - r.invested) / r.grossNominal) * 100 : 0;
  return (
    <Frame>
      <div className="grid gap-5 sm:grid-cols-3">
        <Control label="Aporte mensal" value={formatBRL(monthly)}>
          <Slider min={50} max={3000} step={50} value={[monthly]} onValueChange={([v]) => setMonthly(v)} aria-label="Aporte mensal" />
        </Control>
        <Control label="Taxa hipotética" value={`${rate}% a.a.`}>
          <Slider min={2} max={15} step={0.5} value={[rate]} onValueChange={([v]) => setRate(v)} aria-label="Taxa anual" />
        </Control>
        <Control label="Prazo" value={`${years} anos`}>
          <Slider min={1} max={40} step={1} value={[years]} onValueChange={([v]) => setYears(v)} aria-label="Prazo em anos" />
        </Control>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div><p className="text-2xs text-subtle">Você depositou</p><p className="num text-sm font-medium">{formatBRL(r.invested)}</p></div>
        <div><p className="text-2xs text-subtle">Juros acumulados</p><p className="num text-sm font-medium">{formatBRL(r.grossNominal - r.invested)}</p></div>
        <div><p className="text-2xs text-subtle">Juros no total</p><p className="num text-sm font-medium">{formatNumber(share, 0)}%</p></div>
      </div>
      <div className="mt-4">
        <MultiLineChart
          data={data}
          height={180}
          format={(v) => formatBRL(v, { compact: true })}
          xFormat={(x) => `${Math.round(x)}a`}
          lines={[
            { key: "total", label: "Total", color: "#F5F7FA" },
            { key: "investido", label: "Depositado", color: "#667085", dashed: true },
          ]}
        />
      </div>
    </Frame>
  );
}

function Inflation() {
  const [ret, setRet] = useState(10);
  const [inf, setInf] = useState(5);
  const [years, setYears] = useState(10);
  const real = ((1 + ret / 100) / (1 + inf / 100) - 1) * 100;
  const power = 1000 / Math.pow(1 + inf / 100, years);
  return (
    <Frame>
      <div className="grid gap-5 sm:grid-cols-3">
        <Control label="Rendimento nominal" value={`${ret}% a.a.`}>
          <Slider min={0} max={20} step={0.5} value={[ret]} onValueChange={([v]) => setRet(v)} aria-label="Rendimento nominal" />
        </Control>
        <Control label="Inflação" value={`${inf}% a.a.`}>
          <Slider min={0} max={15} step={0.5} value={[inf]} onValueChange={([v]) => setInf(v)} aria-label="Inflação" />
        </Control>
        <Control label="Anos" value={`${years}`}>
          <Slider min={1} max={30} step={1} value={[years]} onValueChange={([v]) => setYears(v)} aria-label="Anos" />
        </Control>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-line p-3">
          <p className="text-2xs text-subtle">Ganho real por ano</p>
          <p className={`num mt-1 text-lg font-semibold ${real < 0 ? "text-down" : ""}`}>{formatNumber(real, 2)}%</p>
          <p className="text-2xs text-subtle">(1 + {ret}%) ÷ (1 + {inf}%) − 1</p>
        </div>
        <div className="rounded-md border border-line p-3">
          <p className="text-2xs text-subtle">R$ 1.000 parados por {years} anos compram o equivalente a</p>
          <p className="num mt-1 text-lg font-semibold">{formatBRL(power)}</p>
          <p className="text-2xs text-subtle">em valores de hoje</p>
        </div>
      </div>
    </Frame>
  );
}

const RISK_ROWS = [
  { name: "Tesouro Selic", risk: 1, ret: 2, note: "Acompanha a Selic, oscila pouco" },
  { name: "CDB de banco grande", risk: 1.5, ret: 2.2, note: "Risco de crédito, com FGC" },
  { name: "Tesouro IPCA+ longo", risk: 3, ret: 3, note: "Oscila com a marcação a mercado" },
  { name: "Fundos imobiliários", risk: 3.5, ret: 3.4, note: "Renda de aluguéis, cotas oscilam" },
  { name: "Ações (ETF de índice)", risk: 4, ret: 4, note: "Maior oscilação, horizonte longo" },
  { name: "Criptomoedas", risk: 5, ret: 4.3, note: "Volatilidade extrema" },
];

function RiskReturn() {
  return (
    <Frame note="Escala qualitativa e ilustrativa (1 a 5) para comparar classes. Não é dado de mercado nem expectativa de retorno.">
      <div className="space-y-3">
        {RISK_ROWS.map((r) => (
          <div key={r.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_1fr_1fr]">
            <div>
              <p className="text-[13px]">{r.name}</p>
              <p className="text-2xs text-subtle sm:hidden">{r.note}</p>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-muted" style={{ width: `${r.risk * 20}%` }} /></div>
                <p className="mt-1 text-2xs text-subtle">Oscilação</p>
              </div>
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-fg" style={{ width: `${r.ret * 20}%` }} /></div>
                <p className="mt-1 text-2xs text-subtle">Potencial de longo prazo</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Reserve() {
  const [cost, setCost] = useState("2500");
  const [kind, setKind] = useState<"estavel" | "clt" | "variavel">("clt");
  const months = kind === "estavel" ? 3 : kind === "clt" ? 6 : 12;
  const value = (Number(cost.replace(",", ".")) || 0) * months;
  return (
    <Frame note="Referência educacional comum. Sua situação pode exigir mais ou menos meses.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Custo de vida mensal (R$)">
          <Input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Sua renda é">
          <Segmented
            value={kind}
            onChange={setKind}
            size="md"
            options={[
              { value: "estavel", label: "Muito estável" },
              { value: "clt", label: "CLT" },
              { value: "variavel", label: "Variável" },
            ]}
          />
        </Field>
      </div>
      <div className="mt-4 rounded-md border border-line p-3">
        <p className="text-2xs text-subtle">Reserva de referência ({months} meses)</p>
        <p className="num mt-1 text-xl font-semibold">{formatBRL(value)}</p>
      </div>
    </Frame>
  );
}

function IR() {
  const [days, setDays] = useState(400);
  const [gain, setGain] = useState("1000");
  const g = Number(gain.replace(",", ".")) || 0;
  const rate = irRate(days);
  return (
    <Frame note="IR sobre o rendimento na renda fixa tributável (Tesouro, CDB). Também há IOF regressivo em resgates com menos de 30 dias, não considerado aqui.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Control label="Dias aplicados" value={`${days} dias`}>
          <Slider min={1} max={1000} step={1} value={[days]} onValueChange={([v]) => setDays(v)} aria-label="Dias aplicados" />
        </Control>
        <Field label="Rendimento bruto (R$)">
          <Input inputMode="decimal" value={gain} onChange={(e) => setGain(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1">
        {[
          [180, 22.5],
          [360, 20],
          [720, 17.5],
          [Infinity, 15],
        ].map(([lim, r], i, arr) => {
          const prev = i === 0 ? 0 : (arr[i - 1][0] as number);
          const active = days > prev && days <= (lim as number);
          return (
            <div key={i} className={`rounded-md border px-2 py-2 text-center transition-colors ${active ? "border-fg/50 bg-elevated" : "border-line"}`}>
              <p className="num text-sm font-medium">{formatNumber(r as number, 1)}%</p>
              <p className="text-2xs text-subtle">{lim === Infinity ? "> 720 d" : `até ${lim} d`}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] text-muted">
        Imposto: <span className="num text-fg">{formatBRL(g * rate)}</span> · Rendimento líquido: <span className="num text-fg">{formatBRL(g * (1 - rate))}</span>
      </p>
    </Frame>
  );
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Volatility() {
  const [seed, setSeed] = useState(7);
  const [vol, setVol] = useState<"baixa" | "alta">("alta");
  const data = useMemo(() => {
    const rnd = mulberry32(seed);
    let v = 100;
    const sigma = vol === "alta" ? 0.075 : 0.02;
    const out = [{ t: 0, v }];
    for (let m = 1; m <= 60; m++) {
      const z = Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
      v = v * Math.exp(0.006 - (sigma * sigma) / 2 + sigma * z);
      out.push({ t: m, v });
    }
    return out;
  }, [seed, vol]);
  const min = Math.min(...data.map((d) => d.v));
  return (
    <Frame note="Simulação aleatória ilustrativa (passeio aleatório). Não são dados reais de nenhum ativo.">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={vol} onChange={setVol} options={[{ value: "baixa", label: "Volatilidade baixa" }, { value: "alta", label: "Volatilidade alta" }]} />
        <Button size="sm" variant="ghost" onClick={() => setSeed((s) => s + 1)}>
          <RefreshCw /> Outro cenário
        </Button>
      </div>
      <TimeAreaChart data={data} height={170} format={(v) => formatNumber(v, 0)} labelFormat={(t) => `Mês ${t}`} showAxis={false} />
      <p className="mt-2 text-xs text-muted">
        Partindo de 100, o menor valor no caminho foi <span className="num text-fg">{formatNumber(min, 0)}</span> e o final, <span className="num text-fg">{formatNumber(data.at(-1)!.v, 0)}</span>.
      </p>
    </Frame>
  );
}

function Diversification() {
  const [n, setN] = useState(1);
  const [corr, setCorr] = useState(0.3);
  // Volatilidade de uma carteira igualmente ponderada com n ativos de mesma volatilidade e correlação média.
  const single = 30;
  const port = single * Math.sqrt(1 / n + (1 - 1 / n) * corr);
  return (
    <Frame note="Modelo simplificado: ativos com a mesma volatilidade e correlação média constante.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Control label="Quantidade de ativos" value={`${n}`}>
          <Slider min={1} max={30} step={1} value={[n]} onValueChange={([v]) => setN(v)} aria-label="Quantidade de ativos" />
        </Control>
        <Control label="Correlação entre eles" value={formatNumber(corr, 1)}>
          <Slider min={0} max={1} step={0.1} value={[corr]} onValueChange={([v]) => setCorr(v)} aria-label="Correlação" />
        </Control>
      </div>
      <div className="mt-5 space-y-3">
        {[
          ["Um único ativo", single],
          ["Sua carteira", port],
        ].map(([l, v]) => (
          <div key={l as string}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted">{l}</span>
              <span className="num">{formatNumber(v as number, 1)}% de oscilação anual</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-elevated">
              <div className="h-full rounded-full bg-fg transition-[width] duration-300" style={{ width: `${((v as number) / single) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Quanto menor a correlação, mais a diversificação reduz a oscilação. Com correlação 1, ter mais ativos não ajuda.</p>
    </Frame>
  );
}

export function LessonWidget({ kind }: { kind: WidgetKind }) {
  switch (kind) {
    case "juros-compostos":
      return <Compound />;
    case "inflacao":
      return <Inflation />;
    case "risco-retorno":
      return <RiskReturn />;
    case "reserva":
      return <Reserve />;
    case "ir-regressivo":
      return <IR />;
    case "volatilidade":
      return <Volatility />;
    case "diversificacao":
      return <Diversification />;
  }
}
