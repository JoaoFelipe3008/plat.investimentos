"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { formatBRL } from "@/lib/format";
import { useApp, type Profile } from "@/lib/store";
import { cn } from "@/lib/utils";

type Draft = Partial<Omit<Profile, "completedAt">>;

const Schema = z.object({
  name: z.string().trim().min(1).max(40),
  knowledge: z.enum(["nenhum", "basico", "intermediario"]),
  goal: z.enum(["reserva", "curto", "aposentadoria", "patrimonio", "aprender"]),
  monthly: z.number().min(0).max(1_000_000),
  horizon: z.enum(["ate1", "1a5", "mais5"]),
  lossReaction: z.enum(["vende", "espera", "compra"]),
  hasReserve: z.boolean(),
});

interface Step {
  key: keyof Draft;
  title: string;
  hint?: string;
  options?: { value: string | boolean; label: string; description?: string }[];
}

const STEPS: Step[] = [
  { key: "name", title: "Como podemos te chamar?", hint: "Usamos apenas para personalizar a saudação." },
  {
    key: "knowledge",
    title: "Quanto você entende sobre investimentos?",
    options: [
      { value: "nenhum", label: "Estou começando do zero", description: "Nunca investi ou só uso a poupança." },
      { value: "basico", label: "Conheço o básico", description: "Já ouvi falar de CDI, Tesouro e ações." },
      { value: "intermediario", label: "Já invisto", description: "Tenho alguns investimentos e quero me aprofundar." },
    ],
  },
  {
    key: "goal",
    title: "Qual é o seu principal objetivo?",
    options: [
      { value: "reserva", label: "Montar uma reserva de emergência" },
      { value: "curto", label: "Juntar para algo específico", description: "Viagem, curso, carro, entrada de imóvel." },
      { value: "aposentadoria", label: "Aposentadoria e independência financeira" },
      { value: "patrimonio", label: "Fazer o patrimônio crescer no longo prazo" },
      { value: "aprender", label: "Por enquanto, quero aprender" },
    ],
  },
  { key: "monthly", title: "Quanto pretende investir por mês?", hint: "Uma estimativa. Qualquer valor é um bom começo." },
  {
    key: "horizon",
    title: "Quando pretende usar esse dinheiro?",
    options: [
      { value: "ate1", label: "Em até 1 ano" },
      { value: "1a5", label: "Entre 1 e 5 anos" },
      { value: "mais5", label: "Daqui a mais de 5 anos" },
    ],
  },
  {
    key: "lossReaction",
    title: "Seu investimento caiu 15% em um mês. O que você faria?",
    options: [
      { value: "vende", label: "Venderia para não perder mais" },
      { value: "espera", label: "Esperaria para entender o que aconteceu" },
      { value: "compra", label: "Aproveitaria para investir mais" },
    ],
  },
  {
    key: "hasReserve",
    title: "Você já tem uma reserva de emergência?",
    hint: "Dinheiro guardado para imprevistos, que pode ser resgatado rapidamente.",
    options: [
      { value: true, label: "Sim, já tenho" },
      { value: false, label: "Ainda não" },
    ],
  },
];

const PRESETS = [50, 100, 300, 500, 1000];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState<Draft>({ monthly: 100 });
  const setProfile = useApp((s) => s.setProfile);
  const router = useRouter();
  const step = STEPS[i];
  const value = draft[step.key];
  const valid = step.key === "name" ? !!draft.name?.trim() : step.key === "monthly" ? (draft.monthly ?? -1) >= 0 : value !== undefined;

  const next = () => {
    if (!valid) return;
    if (i < STEPS.length - 1) {
      setDir(1);
      setI(i + 1);
      return;
    }
    const parsed = Schema.safeParse(draft);
    if (!parsed.success) return;
    setProfile({ ...parsed.data, completedAt: new Date().toISOString() });
    router.replace("/guia?novo=1");
  };
  const back = () => {
    setDir(-1);
    setI(Math.max(0, i - 1));
  };
  const choose = (v: string | boolean) => {
    setDraft((d) => ({ ...d, [step.key]: v }));
    setTimeout(() => {
      setDir(1);
      setI((x) => Math.min(STEPS.length - 1, x + 1));
    }, i < STEPS.length - 1 ? 180 : 0);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between px-6">
        <Logo />
        <span className="num text-xs text-subtle">
          {i + 1} de {STEPS.length}
        </span>
      </header>
      <div className="mx-auto h-px w-full max-w-xl bg-line">
        <motion.div className="h-px bg-fg" animate={{ width: `${((i + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.35 }} />
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pb-10 pt-12 md:pt-20">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step.key}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {i === 0 && <p className="mb-3 text-[13px] text-muted">Vamos montar a sua trilha de aprendizado. Leva menos de um minuto.</p>}
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">{step.title}</h1>
            {step.hint && <p className="mt-2 text-[13px] text-muted">{step.hint}</p>}

            <div className="mt-8">
              {step.key === "name" && (
                <Input
                  autoFocus
                  maxLength={40}
                  placeholder="Seu nome"
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  className="h-12 text-base"
                />
              )}

              {step.key === "monthly" && (
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">R$</span>
                    <Input
                      autoFocus
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={draft.monthly ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, monthly: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)) }))}
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      className="h-12 pl-11 text-base"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setDraft((d) => ({ ...d, monthly: p }))}
                        className={cn(
                          "num h-8 rounded-md border px-3 text-[13px] transition-colors",
                          draft.monthly === p ? "border-fg/50 bg-elevated text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg",
                        )}
                      >
                        {formatBRL(p)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step.options && (
                <div className="space-y-2" role="radiogroup" aria-label={step.title}>
                  {step.options.map((o) => {
                    const selected = value === o.value;
                    return (
                      <button
                        key={String(o.value)}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => choose(o.value)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-colors",
                          selected ? "border-fg/40 bg-elevated" : "border-line bg-surface hover:border-line-strong hover:bg-elevated/60",
                        )}
                      >
                        <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", selected ? "border-fg bg-fg text-bg" : "border-line-strong")}>
                          {selected && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{o.label}</span>
                          {o.description && <span className="mt-0.5 block text-xs text-muted">{o.description}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={i === 0}>
            <ArrowLeft /> Voltar
          </Button>
          <Button variant="primary" onClick={next} disabled={!valid}>
            {i === STEPS.length - 1 ? "Criar minha trilha" : "Continuar"} <ArrowRight />
          </Button>
        </div>

        <p className="mt-auto pt-12 text-2xs leading-relaxed text-subtle">
          Suas respostas definem um perfil <strong className="font-medium text-muted">educacional</strong>, usado só para ordenar o conteúdo.
          Elas não constituem análise de perfil de investidor (suitability) nem geram recomendações de investimento.
          No modo local, ficam armazenadas apenas neste navegador.
        </p>
      </main>
    </div>
  );
}
