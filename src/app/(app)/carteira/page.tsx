"use client";

import { Coins, History, Plus, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { z } from "zod";
import { CATEGORY_COLORS, Donut } from "@/components/charts/charts";
import { PageHeader } from "@/components/shell/app-shell";
import { Term } from "@/components/term";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { AnimatedNumber, Dialog, Segmented } from "@/components/ui/interactive";
import { Badge, Change, EmptyState, Field, Input, Select, Skeleton, Stat } from "@/components/ui/primitives";
import { ASSETS, CATEGORY_LABEL, EXPLORE_CATEGORIES, getAsset, isPriced } from "@/data/assets";
import { useMask, usePortfolio } from "@/hooks/use-portfolio";
import { diversificationLabel } from "@/lib/finance/portfolio";
import { formatBRL, formatDate, formatMoney, formatNumber, todayISO } from "@/lib/format";
import { useApp, type Transaction } from "@/lib/store";
import { cn } from "@/lib/utils";

const REGISTRABLE = ASSETS.filter((a) => EXPLORE_CATEGORIES.includes(a.category));

function parseNum(s: string) {
  const v = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(v) ? v : NaN;
}

function PortfolioContent() {
  const pf = usePortfolio();
  const mask = useMask();
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [tab, setTab] = useState<"posicoes" | "movimentacoes" | "proventos">("posicoes");
  const loadExample = useApp((s) => s.loadExamplePortfolio);
  const clearExamples = useApp((s) => s.clearExamples);
  const hasExample = pf.positions.some((p) => p.example) || useApp.getState().transactions.some((t) => t.example);

  useEffect(() => {
    if (params.get("novo") === "1") setOpen(true);
  }, [params]);

  const closeDialog = (o: boolean) => {
    setOpen(o);
    if (!o && params.get("novo")) router.replace("/carteira");
  };

  const div = diversificationLabel(pf.hhi, pf.positions.length);

  return (
    <>
      <PageHeader
        title="Minha carteira"
        description="Acompanhe seus investimentos registrando compras e vendas manualmente. O Lastro não se conecta a corretoras e não executa operações."
        actions={
          <>
            <Button size="sm" onClick={() => setIncomeOpen(true)} disabled={!pf.positions.length}>
              <Coins /> Registrar provento
            </Button>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus /> Registrar movimentação
            </Button>
          </>
        }
      />

      {hasExample && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#f5b74e]/30 bg-[#f5b74e]/[0.06] px-4 py-3">
          <p className="text-[13px] text-muted">
            <span className="font-medium text-[#f5b74e]">Carteira de exemplo.</span> Quantidades e preços de compra são fictícios; o valor atual usa cotações reais quando disponíveis.
          </p>
          <Button size="sm" variant="ghost" onClick={clearExamples}>Remover exemplo</Button>
        </div>
      )}

      {!pf.hasData ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="Comece registrando um investimento"
            description="Informe o ativo, a quantidade e o preço pago. Para Tesouro e renda fixa, registre o valor aplicado."
            action={
              <>
                <Button variant="primary" onClick={() => setOpen(true)}><Plus /> Registrar movimentação</Button>
                <Button onClick={loadExample}>Carregar carteira de exemplo</Button>
              </>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <p className="text-xs text-muted">Valor atual estimado</p>
              <div className="num mt-1 text-[32px] font-semibold tracking-[-0.02em]">
                {pf.quotes.isLoading ? <Skeleton className="h-9 w-48" /> : <AnimatedNumber value={pf.total} format={(v) => mask(formatBRL(v))} />}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                <Stat label="Total investido" value={mask(formatBRL(pf.invested))} />
                <Stat label="Resultado" value={<span className={pf.pnl >= 0 ? "text-up" : "text-down"}>{mask(formatBRL(pf.pnl))}</span>} sub={<Change value={pf.pnlPct} />} />
                <Stat label="Variação hoje" value={<Change value={pf.dayChangePct} />} sub={<span className="text-subtle">ativos cotados</span>} />
                <Stat label={<Term id="dividendos">Proventos</Term>} value={mask(formatBRL(pf.incomeTotal))} />
              </div>
              {(pf.unpricedCount > 0 || pf.usdMissing) && (
                <p className="mt-4 text-2xs leading-relaxed text-subtle">
                  {pf.unpricedCount > 0 && "Ativos sem cotação disponível (renda fixa, Tesouro ou fonte não configurada) entram pelo valor aplicado. "}
                  {pf.usdMissing && "Cotação do dólar indisponível: ativos em USD não puderam ser convertidos."}
                </p>
              )}
            </Card>

            <Card delay={0.04}>
              <CardHeader title="Diversificação" description={<Badge tone={div.tone === "warn" ? "warn" : "neutral"}>{div.label}</Badge>} />
              <div className="flex items-center gap-4 px-5 pb-5">
                <Donut data={pf.byCategory.map((c) => ({ name: c.name, value: c.value }))} size={112} />
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {pf.byCategory.map((c, i) => (
                    <li key={c.category} className="flex items-center gap-2 text-xs">
                      <span className="size-2 shrink-0 rounded-[2px]" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="truncate text-muted">{c.name}</span>
                      <span className="num ml-auto">{formatNumber(c.pct, 1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">
                {div.text}
                {pf.largest && pf.largest.pct > 40 && (
                  <span className="mt-1 block text-[#f5b74e]">{pf.largest.symbol} representa {formatNumber(pf.largest.pct, 0)}% da carteira.</span>
                )}
              </div>
            </Card>
          </div>

          <div className="mb-3 mt-6">
            <Segmented
              value={tab}
              onChange={setTab}
              size="md"
              label="Seção"
              options={[
                { value: "posicoes", label: `Posições (${pf.positions.length})` },
                { value: "movimentacoes", label: "Movimentações" },
                { value: "proventos", label: "Proventos" },
              ]}
            />
          </div>
          {tab === "posicoes" && <PositionsTable />}
          {tab === "movimentacoes" && <TransactionsTable />}
          {tab === "proventos" && <IncomesTable onAdd={() => setIncomeOpen(true)} />}
        </>
      )}

      <TransactionDialog open={open} onOpenChange={closeDialog} defaultSymbol={params.get("ativo") ?? undefined} />
      <IncomeDialog open={incomeOpen} onOpenChange={setIncomeOpen} />
      <p className="mt-6 text-2xs leading-relaxed text-subtle">
        Acompanhamento informativo. Valores são estimativas baseadas nas cotações das fontes indicadas e nos dados que você registrou; confira sempre o extrato da sua corretora.
      </p>
    </>
  );
}

function PositionsTable() {
  const pf = usePortfolio();
  const mask = useMask();
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-2xs uppercase tracking-[0.05em] text-subtle">
              <th className="px-5 py-2.5 font-medium">Ativo</th>
              <th className="px-3 py-2.5 text-right font-medium">Quantidade</th>
              <th className="px-3 py-2.5 text-right font-medium"><Term id="preco-medio">Preço médio</Term></th>
              <th className="px-3 py-2.5 text-right font-medium">Preço atual</th>
              <th className="px-3 py-2.5 text-right font-medium">Valor</th>
              <th className="px-3 py-2.5 text-right font-medium">Resultado</th>
              <th className="px-5 py-2.5 text-right font-medium">% carteira</th>
            </tr>
          </thead>
          <tbody>
            {pf.positions.map((p) => {
              const a = getAsset(p.symbol)!;
              const unit = a.unit === "USD" ? "USD" : "BRL";
              return (
                <tr key={p.symbol} className="border-b border-line last:border-0 hover:bg-elevated/30">
                  <td className="px-5 py-3">
                    <Link href={`/explorar/${p.symbol}`} className="hover:underline">
                      <p className="num font-medium">{p.symbol}</p>
                    </Link>
                    <p className="text-xs text-subtle">{CATEGORY_LABEL[p.category]}</p>
                  </td>
                  <td className="num px-3 py-3 text-right">{isPriced(a) ? formatNumber(p.quantity, 8) : "—"}</td>
                  <td className="num px-3 py-3 text-right">{isPriced(a) ? mask(formatMoney(p.avgPrice, unit)) : "—"}</td>
                  <td className="num px-3 py-3 text-right">
                    {p.price != null ? formatBRL(p.price) : <span className="text-xs text-subtle">{isPriced(a) ? "indisponível" : "valor aplicado"}</span>}
                  </td>
                  <td className="num px-3 py-3 text-right font-medium">{mask(formatBRL(p.value))}</td>
                  <td className="px-3 py-3 text-right">
                    {p.pnl != null ? (
                      <div>
                        <p className={cn("num", p.pnl >= 0 ? "text-up" : "text-down")}>{mask(formatBRL(p.pnl))}</p>
                        <Change value={p.pnlPct} className="text-xs" />
                      </div>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </td>
                  <td className="num px-5 py-3 text-right text-muted">{formatNumber(pf.total ? (p.value / pf.total) * 100 : 0, 1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TransactionsTable() {
  const txs = useApp((s) => s.transactions);
  const remove = useApp((s) => s.removeTransaction);
  const mask = useMask();
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="overflow-hidden">
      {!sorted.length ? (
        <EmptyState icon={History} title="Sem movimentações" />
      ) : (
        <ul>
          {sorted.map((t) => {
            const a = getAsset(t.symbol);
            const unit = a?.unit === "USD" ? "USD" : "BRL";
            return (
              <li key={t.id} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-0">
                <Badge tone={t.type === "compra" ? "neutral" : "outline"}>{t.type === "compra" ? "Compra" : "Venda"}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]">
                    <span className="num font-medium">{t.symbol}</span>
                    {a && isPriced(a) && <span className="num text-muted"> · {formatNumber(t.quantity, 8)} × {mask(formatMoney(t.price, unit))}</span>}
                    {t.example && <Badge tone="warn" className="ml-2">Exemplo</Badge>}
                  </p>
                  <p className="text-xs text-subtle">{formatDate(t.date)}{t.note ? ` · ${t.note}` : ""}</p>
                </div>
                <p className="num text-[13px]">{mask(formatMoney(t.quantity * t.price + (t.type === "compra" ? t.fees : -t.fees), unit))}</p>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(t.id)} aria-label={`Excluir movimentação de ${t.symbol}`}>
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function IncomesTable({ onAdd }: { onAdd: () => void }) {
  const incomes = useApp((s) => s.incomes);
  const remove = useApp((s) => s.removeIncome);
  const mask = useMask();
  const KIND = { dividendo: "Dividendo", jcp: "JCP", rendimento: "Rendimento" };
  return (
    <Card className="overflow-hidden">
      {!incomes.length ? (
        <EmptyState icon={Coins} title="Nenhum provento registrado" description="Registre dividendos, JCP e rendimentos de FIIs recebidos." action={<Button size="sm" onClick={onAdd}>Registrar provento</Button>} />
      ) : (
        <ul>
          {[...incomes].sort((a, b) => b.date.localeCompare(a.date)).map((i) => (
            <li key={i.id} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-0">
              <Badge>{KIND[i.kind]}</Badge>
              <div className="min-w-0 flex-1">
                <p className="num text-[13px] font-medium">{i.symbol}{i.example && <Badge tone="warn" className="ml-2">Exemplo</Badge>}</p>
                <p className="text-xs text-subtle">{formatDate(i.date)}</p>
              </div>
              <p className="num text-[13px] text-up">{mask(formatBRL(i.amount))}</p>
              <Button variant="ghost" size="icon-sm" onClick={() => remove(i.id)} aria-label="Excluir provento"><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const TxSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["compra", "venda"]),
  quantity: z.number({ invalid_type_error: "Quantidade inválida" }).positive("Quantidade deve ser maior que zero"),
  price: z.number({ invalid_type_error: "Preço inválido" }).positive("Valor deve ser maior que zero"),
  fees: z.number().min(0, "Taxas não podem ser negativas"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => d <= todayISO(), "A data não pode estar no futuro"),
  note: z.string().max(280).optional(),
});

function TransactionDialog({ open, onOpenChange, defaultSymbol }: { open: boolean; onOpenChange: (o: boolean) => void; defaultSymbol?: string }) {
  const add = useApp((s) => s.addTransaction);
  const positions = usePortfolio().positions;
  const [symbol, setSymbol] = useState("PETR4");
  const [type, setType] = useState<Transaction["type"]>("compra");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && defaultSymbol && getAsset(defaultSymbol)) setSymbol(defaultSymbol);
  }, [open, defaultSymbol]);

  const asset = getAsset(symbol);
  const priced = asset ? isPriced(asset) : true;
  const held = positions.find((p) => p.symbol === symbol)?.quantity ?? 0;

  const submit = () => {
    const parsed = TxSchema.safeParse({
      symbol,
      type,
      quantity: priced ? parseNum(quantity) : 1,
      price: parseNum(price),
      fees: parseNum(fees || "0"),
      date,
      note: note.trim() || undefined,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Verifique os campos");
    if (parsed.data.type === "venda" && priced && parsed.data.quantity > held + 1e-12) {
      return setError(`Você possui ${formatNumber(held, 8)} unidades registradas de ${symbol}.`);
    }
    add(parsed.data);
    setQuantity("");
    setPrice("");
    setNote("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Registrar movimentação" description="Apenas para acompanhamento. Nenhuma ordem é enviada a corretoras.">
      <div className="space-y-4">
        <Segmented value={type} onChange={setType} size="md" options={[{ value: "compra", label: "Compra" }, { value: "venda", label: "Venda" }]} />
        <Field label="Ativo">
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {EXPLORE_CATEGORIES.map((c) => (
              <optgroup key={c} label={CATEGORY_LABEL[c]}>
                {REGISTRABLE.filter((a) => a.category === c).map((a) => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} — {a.name}</option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {priced ? (
            <>
              <Field label="Quantidade"><Input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" /></Field>
              <Field label={`Preço unitário (${asset?.unit === "USD" ? "US$" : "R$"})`}><Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" /></Field>
            </>
          ) : (
            <Field label={type === "compra" ? "Valor aplicado (R$)" : "Valor resgatado (R$)"} className="col-span-2" hint="Renda fixa e Tesouro são acompanhados pelo valor aplicado.">
              <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1.000,00" />
            </Field>
          )}
          <Field label="Taxas (R$)"><Input inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} /></Field>
          <Field label="Data"><Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <Field label="Observação (opcional)"><Input value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: corretora, objetivo" /></Field>
        {error && <p className="text-xs text-down">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" onClick={submit}>Salvar</Button>
        </div>
      </div>
    </Dialog>
  );
}

const IncomeSchema = z.object({
  symbol: z.string().min(1),
  kind: z.enum(["dividendo", "jcp", "rendimento"]),
  amount: z.number({ invalid_type_error: "Valor inválido" }).positive("Valor deve ser maior que zero"),
  date: z.string().refine((d) => d <= todayISO(), "A data não pode estar no futuro"),
});

function IncomeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useApp((s) => s.addIncome);
  const positions = usePortfolio().positions;
  const [symbol, setSymbol] = useState("");
  const [kind, setKind] = useState<"dividendo" | "jcp" | "rendimento">("dividendo");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !symbol && positions[0]) setSymbol(positions[0].symbol);
  }, [open, positions, symbol]);

  const submit = () => {
    const parsed = IncomeSchema.safeParse({ symbol, kind, amount: parseNum(amount), date });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Verifique os campos");
    add(parsed.data);
    setAmount("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Registrar provento" description="Dividendos, JCP ou rendimentos recebidos.">
      <div className="space-y-4">
        <Field label="Ativo">
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {positions.map((p) => <option key={p.symbol} value={p.symbol}>{p.symbol} — {p.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="dividendo">Dividendo</option>
              <option value="jcp">JCP</option>
              <option value="rendimento">Rendimento (FII)</option>
            </Select>
          </Field>
          <Field label="Valor líquido (R$)"><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></Field>
          <Field label="Data de pagamento" className="col-span-2"><Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        {error && <p className="text-xs text-down">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" onClick={submit}>Salvar</Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense>
      <PortfolioContent />
    </Suspense>
  );
}
