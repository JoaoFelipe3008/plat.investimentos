"use client";

import { ArrowLeft, ArrowRight, Check, Clock, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { LessonWidget } from "@/components/lesson-widgets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { findLesson, type QuizQuestion } from "@/data/lessons";
import { buildTrail, lessonKey } from "@/lib/finance/trail";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function LessonPage() {
  const { modulo, licao } = useParams<{ modulo: string; licao: string }>();
  const found = findLesson(modulo, licao);
  const profile = useApp((s) => s.profile);
  const progress = useApp((s) => s.lessons);
  if (!found) notFound();
  const { module: m, lesson } = found;
  const key = lessonKey(m.id, lesson.id);
  const trail = buildTrail(profile);
  const idx = trail.order.indexOf(key);
  const nextKey = trail.order.slice(idx + 1).find((k) => !progress[k]) ?? trail.order[idx + 1];
  const [nm, nl] = nextKey?.split("/") ?? [];
  const next = nm ? findLesson(nm, nl) : null;
  const done = progress[key];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/guia" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> Meu guia
      </Link>
      <div className="mb-8 mt-4">
        <p className="text-xs text-muted">Módulo {m.number} · {m.title}</p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{lesson.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-subtle">
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {lesson.minutes} min</span>
          {done && <span className="inline-flex items-center gap-1 text-up"><Check className="size-3.5" /> Concluída</span>}
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{lesson.summary}</p>
      </div>

      <div className="space-y-3">
        {lesson.cards.map((c, i) => (
          <Card key={c.title} delay={0.05 + i * 0.05} className="p-5">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="num text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold">{c.title}</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.body}</p>
                  {c.widget && <LessonWidget kind={c.widget} />}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Quiz key={key} lessonKey={key} questions={lesson.quiz} />

      <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
        <Link href="/guia"><Button variant="ghost"><ArrowLeft /> Voltar à trilha</Button></Link>
        {next && (
          <Link href={`/guia/${next.module.id}/${next.lesson.id}`}>
            <Button variant="secondary">
              Próxima: <span className="max-w-[160px] truncate sm:max-w-[260px]">{next.lesson.title}</span> <ArrowRight />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Quiz({ lessonKey: key, questions }: { lessonKey: string; questions: QuizQuestion[] }) {
  const complete = useApp((s) => s.completeLesson);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = questions[i];

  const answer = (idx: number) => {
    if (picked != null) return;
    setPicked(idx);
    if (idx === q.correct) setCorrect((c) => c + 1);
  };
  const advance = () => {
    if (i < questions.length - 1) {
      setI(i + 1);
      setPicked(null);
    } else {
      const score = correct / questions.length;
      complete(key, score);
      setFinished(true);
    }
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setCorrect(0);
    setFinished(false);
  };

  return (
    <Card delay={0.15} className="mt-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-[13px] font-medium">Desafio rápido</p>
        <p className="num text-xs text-subtle">{finished ? "Concluído" : `${i + 1} de ${questions.length}`}</p>
      </div>
      <div className="p-5">
        <AnimatePresence mode="wait" initial={false}>
          {finished ? (
            <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-up/10 text-up">
                <Check className="size-5" />
              </div>
              <p className="text-sm font-medium">Lição concluída</p>
              <p className="num mt-1 text-xs text-muted">{correct} de {questions.length} respostas corretas</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={restart}>Refazer desafio</Button>
            </motion.div>
          ) : (
            <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <p className="text-[15px] font-medium leading-snug">{q.q}</p>
              <div className="mt-4 space-y-2">
                {q.options.map((o, idx) => {
                  const state = picked == null ? "idle" : idx === q.correct ? "right" : idx === picked ? "wrong" : "dim";
                  return (
                    <button
                      key={o}
                      onClick={() => answer(idx)}
                      disabled={picked != null}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-[13px] transition-colors",
                        state === "idle" && "border-line hover:border-line-strong hover:bg-elevated/50",
                        state === "right" && "border-up/50 bg-up/[0.07] text-fg",
                        state === "wrong" && "border-down/50 bg-down/[0.07] text-fg",
                        state === "dim" && "border-line text-subtle",
                      )}
                    >
                      <span className="flex-1">{o}</span>
                      {state === "right" && <Check className="size-4 text-up" />}
                      {state === "wrong" && <X className="size-4 text-down" />}
                    </button>
                  );
                })}
              </div>
              {picked != null && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <p className="mt-4 rounded-md bg-elevated px-4 py-3 text-[13px] leading-relaxed text-muted">
                    <span className={cn("font-medium", picked === q.correct ? "text-up" : "text-down")}>{picked === q.correct ? "Correto. " : "Não exatamente. "}</span>
                    {q.explain}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <Button variant="primary" onClick={advance}>
                      {i < questions.length - 1 ? "Próxima pergunta" : "Concluir lição"} <ArrowRight />
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
