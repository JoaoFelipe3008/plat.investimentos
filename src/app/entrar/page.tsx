"use client";

import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { z } from "zod";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";

function SignIn() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(params.get("erro") ? "error" : "idle");
  const [message, setMessage] = useState(params.get("erro") ? "O link expirou ou é inválido. Solicite um novo." : "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) {
      setState("error");
      setMessage("Informe um e-mail válido.");
      return;
    }
    setState("sending");
    const next = params.get("next") ?? "/";
    const { error } = await getSupabase()!.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setState("error");
      // Mensagem genérica: não revela se o e-mail existe.
      setMessage("Não foi possível enviar o link agora. Tente novamente em instantes.");
    } else {
      setState("sent");
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">Entrar no Lastro</h1>
        {!supabaseConfigured ? (
          <>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Esta instalação está em <strong className="font-medium text-fg">modo local</strong>: não há login e seus dados ficam apenas neste navegador.
              Para ativar contas, configure as variáveis do Supabase descritas no README.
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button variant="primary">Continuar no modo local <ArrowRight /></Button>
            </Link>
          </>
        ) : state === "sent" ? (
          <div className="mt-6 rounded-lg border border-line bg-surface p-5">
            <Mail className="size-5 text-muted" />
            <p className="mt-3 text-sm font-medium">Verifique seu e-mail</p>
            <p className="mt-1 text-[13px] text-muted">Se houver uma conta ou cadastro possível para {email}, você receberá um link de acesso válido por tempo limitado.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-[13px] text-muted">Enviaremos um link de acesso seguro, sem senha.</p>
            <Field label="E-mail">
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            </Field>
            {state === "error" && <p className="text-xs text-down">{message}</p>}
            <Button type="submit" variant="primary" className="w-full" disabled={state === "sending"}>
              {state === "sending" ? "Enviando…" : "Receber link de acesso"}
            </Button>
            <p className="text-2xs leading-relaxed text-subtle">
              Ao continuar, você concorda com o tratamento dos seus dados para autenticação e funcionamento da plataforma, conforme a LGPD.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
