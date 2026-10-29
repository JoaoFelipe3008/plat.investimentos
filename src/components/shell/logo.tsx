export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#F5F7FA" />
        <path d="M7 6.5v11h10" fill="none" stroke="#080A0D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 13.5l2.5-2.5 2 1.6 2.5-3.6" fill="none" stroke="#080A0D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">Lastro</span>}
    </span>
  );
}
