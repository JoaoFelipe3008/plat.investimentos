"use client";

import { GLOSSARY } from "@/data/glossary";
import { Tooltip } from "./ui/interactive";

/** Termo do glossário com explicação contextual ao passar o mouse ou focar. */
export function Term({ id, children }: { id: keyof typeof GLOSSARY | string; children?: React.ReactNode }) {
  const g = GLOSSARY[id];
  if (!g) return <>{children}</>;
  return (
    <Tooltip
      content={
        <span>
          <strong className="font-medium">{g.term}.</strong> <span className="text-muted">{g.short}</span>
        </span>
      }
    >
      <button
        type="button"
        className="cursor-help underline decoration-subtle decoration-dotted underline-offset-[3px] hover:decoration-muted"
      >
        {children ?? g.term}
      </button>
    </Tooltip>
  );
}
