"use client";

import { ArrowRight, Check, Lock, RotateCcw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, Input } from "@/components/ui/primitives";
import { GLOSSARY } from "@/data/glossary";
import { MODULES } from "@/data/lessons";
import { buildTrail, lessonKey, moduleProgress, nextLessons } from "@/lib/finance/trail";
import { useApp } from "@/lib/store";
import { cn, normalize } from "@/lib/utils";

const GOAL_LABEL = {
  reserva: "Montar a reserva de emergência",
  curto: "Juntar para um objetivo específico",
  aposentadoria: "Aposentadoria e independência",
  patrimonio: "Crescer o patrimônio no longo prazo",
  aprender: "Aprender sobre investimentos",
};

function GuideContent() {
  const profile = useApp((s) => s.profile)!;
  const lessons = useApp((s) => s.lessons);
  const setProfile = useApp((s) => s.setProfile);
  const router = useRouter();
  const isNew = useSearchParams().get("novo") === "1";
  const trail = useMemo(() => buildTrail(profile), [profile]);
  const next = nextLessons(trail, lessons, 1)[0];
  const done = Object.keys(lessons).length;
  const total = trail.order.length;

  return (
    <>
      <PageHeader
        title="Meu guia"
        description="Uma trilha em módulos curtos, com exemplos interativos e questionários. Ordenada a partir das suas respostas, sem recomendações de produtos."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setProfile(null as never);
              router.push("/bem-vindo");
            }}
          >
            <RotateCcw /> Refazer questionário
          </Button>
        }
      />

      {isNew && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-start gap-3 rounded-lg border border-line-strong bg-elevated/60 px-4 py-3">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          <p className="text-[13px] text-muted">
            <span className="font-medium text-fg">Sua trilha está pronta.</span> Ela foi organizada pelo que você nos contou e pode ser feita no seu ritmo.
          </p>
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted">Trilha · {trail.levelLabel}</p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.01em]">{GOAL_LABEL[profile.goal]}</p>
            </div>
            <div className="text-right">
              <p className="num text-2xl font-semibold">{Math.round((done / total) * 100)}%</p>
              <p className="text-xs text-subtle">{done} de {total} lições</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-elevated">
            <motion.div className="h-full rounded-full bg-fg" initial={{ width: 0 }} animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          {next && (
            <Link
              href={`/guia/${next.module.id}/${next.lesson.id}`}
              className="group mt-5 flex items-center gap-4 rounded-lg border border-line bg-bg px-4 py-3.5 transition-colors hover:border-line-strong"
            >
              <div className="min-w-0 flex-1">
                <p className="text-2xs uppercase tracking-[0.06em] text-subtle">Continuar</p>
                <p className="mt-0.5 truncate text-sm font-medium">{next.lesson.title}</p>
                <p className="text-xs text-muted">Módulo {next.module.number} · {next.lesson.minutes} min</p>
              </div>
              <span className="grid size-9 place-items-center rounded-full bg-fg text-bg transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-4" />
              </span>
            </Link>
          )}
        </Card>

        <Card delay={0.04} className="p-5">
          <p className="text-[13px] font-medium">Por que esta ordem</p>
          {trail.notes.length ? (
            <ul className="mt-3 space-y-3">
              {trail.notes.map((n) => (
                <li key={n.title}>
                  <p className="text-[13px] text-fg">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-muted">Seguimos a sequência completa, do conceito mais básico à construção de uma carteira.</p>
          )}
          <p className="mt-4 border-t border-line pt-3 text-2xs leading-relaxed text-subtle">
            Perfil educacional, não análise de suitability. Para recomendações individuais, procure um profissional certificado.
          </p>
        </Card>
      </div>

      <div className="mt-6 space-y-3">
        {MODULES.map((m, mi) => {
          const prog = moduleProgress(m.id, lessons);
          const optional = trail.optionalModules.includes(m.id);
          return (
            <Card key={m.id} delay={0.04 + mi * 0.03} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className={cn("num grid size-9 place-items-center rounded-lg border text-[13px] font-semibold", prog.done === prog.total ? "border-transparent bg-fg text-bg" : "border-line-strong")}>
                  {prog.done === prog.total ? <Check className="size-4" /> : m.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">Módulo {m.number} — {m.title}</h2>
                    {optional && <Badge>Revisão opcional</Badge>}
                  </div>
                  <p className="text-xs text-muted">{m.description}</p>
                </div>
                <div className="flex w-full items-center gap-3 sm:w-48">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-fg/80 transition-[width] duration-700" style={{ width: `${prog.pct}%` }} />
                  </div>
                  <span className="num text-xs text-muted">{prog.done}/{prog.total}</span>
                </div>
              </div>
              <ul className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
                {m.lessons.map((l) => {
                  const k = lessonKey(m.id, l.id);
                  const completed = !!lessons[k];
                  const isNext = next?.key === k;
                  return (
                    <li key={l.id} className="border-b border-line sm:[&:nth-child(odd)]:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0">
                      <Link href={`/guia/${m.id}/${l.id}`} className={cn("flex h-full items-start gap-3 px-5 py-3.5 transition-colors hover:bg-elevated/40", isNext && "bg-elevated/30")}>
                        <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", completed ? "border-up bg-up text-bg" : isNext ? "border-fg" : "border-line-strong")}>
                          {completed && <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className={cn("block text-[13px]", completed ? "text-muted" : "font-medium text-fg")}>{l.title}</span>
                          <span className="mt-0.5 block text-xs text-subtle">
                            {l.minutes} min · {l.quiz.length} {l.quiz.length === 1 ? "pergunta" : "perguntas"}
                            {lessons[k] && ` · ${Math.round(lessons[k].score * 100)}% de acertos`}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>

      <Glossary />
    </>
  );
}

function Glossary() {
  const [q, setQ] = useState("");
  const entries = Object.entries(GLOSSARY)
    .filter(([, g]) => !q || normalize(`${g.term} ${g.short}`).includes(normalize(q)))
    .sort((a, b) => a[1].term.localeCompare(b[1].term, "pt-BR"));
  return (
    <section id="glossario" className="mt-10 scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Glossário</h2>
          <p className="text-xs text-muted">Termos com sublinhado pontilhado na plataforma abrem estas definições.</p>
        </div>
        <Input placeholder="Buscar termo" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-full sm:w-56" />
      </div>
      <Card>
        <dl className="grid sm:grid-cols-2">
          {entries.map(([id, g]) => (
            <div key={id} id={`glossario-${id}`} className="scroll-mt-24 border-b border-line px-5 py-3.5 target:bg-elevated/60 sm:[&:nth-child(odd)]:border-r">
              <dt className="text-[13px] font-medium">{g.term}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-muted">{g.short}</dd>
            </div>
          ))}
        </dl>
        {!entries.length && <p className="px-5 py-8 text-center text-[13px] text-muted">Nenhum termo encontrado.</p>}
      </Card>
      <p className="mt-3 flex items-center gap-1.5 text-2xs text-subtle">
        <Lock className="size-3" /> Seu progresso fica salvo neste navegador{" "}
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? "e na sua conta." : "(modo local)."}
      </p>
    </section>
  );
}

export default function GuidePage() {
  return (
    <Suspense>
      <GuideContent />
    </Suspense>
  );
}
