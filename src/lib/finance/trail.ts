import { ALL_LESSONS, MODULES } from "@/data/lessons";
import type { Profile } from "@/lib/store";

/**
 * Trilha educacional personalizada. Usa as respostas do onboarding apenas para
 * ORDENAR conteúdo e destacar temas — nunca para recomendar produtos ou operações.
 */
export interface Trail {
  order: string[]; // "moduloId/licaoId"
  notes: { title: string; body: string }[];
  optionalModules: string[];
  levelLabel: string;
}

export const lessonKey = (moduleId: string, lessonId: string) => `${moduleId}/${lessonId}`;

export function buildTrail(p: Profile | null): Trail {
  const keys = ALL_LESSONS.map((l) => lessonKey(l.moduleId, l.id));
  if (!p) return { order: keys, notes: [], optionalModules: [], levelLabel: "Trilha completa" };

  const priority: string[] = [];
  const notes: Trail["notes"] = [];
  const optionalModules: string[] = [];

  if (!p.hasReserve) {
    priority.push("primeiros-passos/reserva-emergencia", "renda-fixa/tesouro-direto", "renda-fixa/liquidez");
    notes.push({
      title: "Comece pela reserva de emergência",
      body: "Você informou que ainda não tem uma reserva. Ela vem antes de qualquer investimento de maior risco, por isso a trilha começa por esse tema.",
    });
  }
  if (p.lossReaction === "vende") {
    priority.push("primeiros-passos/risco-retorno", "bolsa/volatilidade");
    notes.push({
      title: "Oscilações fazem parte",
      body: "Você indicou que tende a vender em quedas. Antecipamos as lições sobre risco e volatilidade para ajudar a entender esse comportamento.",
    });
  }
  if (p.horizon === "ate1" || p.goal === "curto") {
    priority.push("carteira/objetivos", "renda-fixa/liquidez");
    notes.push({
      title: "Prazo curto pede previsibilidade",
      body: "Para objetivos de até um ano, conhecer liquidez e renda fixa é o ponto de partida.",
    });
  }
  if (p.goal === "aposentadoria" || (p.goal === "patrimonio" && p.horizon === "mais5")) {
    priority.push("primeiros-passos/juros-compostos", "carteira/aportes", "carteira/diversificacao");
  }
  if (p.knowledge === "intermediario") {
    optionalModules.push("primeiros-passos");
    notes.push({
      title: "Revisão opcional",
      body: "Como você já conhece o básico, o Módulo 1 aparece como revisão. Você pode concluí-lo rapidamente pelos questionários.",
    });
  }

  const ordered = [...new Set([...priority, ...keys.filter((k) => !optionalModules.some((m) => k.startsWith(`${m}/`))), ...keys])];
  return {
    order: ordered,
    notes,
    optionalModules,
    levelLabel: p.knowledge === "nenhum" ? "Do zero" : p.knowledge === "basico" ? "Fundamentos" : "Aprofundamento",
  };
}

export function nextLessons(trail: Trail, completed: Record<string, unknown>, n = 3) {
  return trail.order
    .filter((k) => !completed[k])
    .slice(0, n)
    .map((k) => {
      const [moduleId, lessonId] = k.split("/");
      const m = MODULES.find((x) => x.id === moduleId)!;
      const l = m.lessons.find((x) => x.id === lessonId)!;
      return { key: k, module: m, lesson: l };
    });
}

export function moduleProgress(moduleId: string, completed: Record<string, unknown>) {
  const m = MODULES.find((x) => x.id === moduleId)!;
  const done = m.lessons.filter((l) => completed[lessonKey(m.id, l.id)]).length;
  return { done, total: m.lessons.length, pct: (done / m.lessons.length) * 100 };
}
