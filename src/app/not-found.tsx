import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="num text-xs text-subtle">404</p>
      <h1 className="mt-2 text-xl font-semibold">Página não encontrada</h1>
      <p className="mt-1 text-[13px] text-muted">O endereço pode ter mudado ou o ativo não faz parte do catálogo.</p>
      <Link href="/" className="mt-6 inline-flex h-9 items-center rounded-md bg-fg px-4 text-sm font-medium text-bg">Voltar à visão geral</Link>
    </div>
  );
}
