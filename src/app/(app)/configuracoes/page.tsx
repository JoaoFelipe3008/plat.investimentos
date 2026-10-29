"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog, Segmented, Switch } from "@/components/ui/interactive";
import { Badge, Field, Input } from "@/components/ui/primitives";
import { DASHBOARD_WIDGETS, useApp, type WidgetId } from "@/lib/store";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";

export default function SettingsPage() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const setProfile = useApp((s) => s.setProfile);
  const setSetting = useApp((s) => s.setSetting);
  const toggleWidget = useApp((s) => s.toggleWidget);
  const resetAll = useApp((s) => s.resetAll);
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [confirm, setConfirm] = useState(false);
  const status = useQuery({
    queryKey: ["status"],
    queryFn: async () => (await fetch("/api/status")).json() as Promise<{ providers: { name: string; configured: boolean; detail: string }[]; supabase: boolean }>,
  });

  const exportData = () => {
    const s = useApp.getState();
    const data = { exportadoEm: new Date().toISOString(), perfil: s.profile, favoritos: s.favorites, licoes: s.lessons, movimentacoes: s.transactions, proventos: s.incomes, alertas: s.alerts, notificacoes: s.notifications };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `lastro-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
    router.push("/entrar");
  };

  return (
    <>
      <PageHeader title="Configurações" description="Perfil, aparência, painel, privacidade e fontes de dados." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Perfil" />
          <div className="space-y-4 px-5 pb-5">
            <Field label="Nome exibido">
              <div className="flex gap-2">
                <Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
                <Button onClick={() => name.trim() && setProfile({ ...profile, name: name.trim() })} disabled={!name.trim() || name.trim() === profile.name}>Salvar</Button>
              </div>
            </Field>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px]">Questionário da trilha</p>
                <p className="text-2xs text-subtle">Respondido em {new Date(profile.completedAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <Link href="/bem-vindo"><Button size="sm" variant="ghost">Refazer</Button></Link>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <div>
                <p className="text-[13px]">Conta</p>
                <p className="text-2xs text-subtle">{supabaseConfigured ? "Sincronizada com Supabase" : "Modo local — dados apenas neste navegador"}</p>
              </div>
              {supabaseConfigured ? (
                <Button size="sm" variant="ghost" onClick={signOut}><LogOut /> Sair</Button>
              ) : (
                <Badge>Modo local</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card delay={0.03}>
          <CardHeader title="Aparência e acessibilidade" />
          <div className="space-y-4 px-5 pb-5">
            <Row label="Ocultar valores da carteira" description="Esconde saldos na tela (útil em locais públicos)">
              <Switch checked={settings.hideValues} onCheckedChange={(v) => setSetting("hideValues", v)} aria-label="Ocultar valores" />
            </Row>
            <Row label="Animações" description="“Sistema” segue a preferência de redução de movimento do seu dispositivo">
              <Segmented value={settings.motion} onChange={(v) => setSetting("motion", v)} options={[{ value: "sistema", label: "Sistema" }, { value: "reduzido", label: "Reduzidas" }]} />
            </Row>
          </div>
        </Card>

        <Card delay={0.06}>
          <CardHeader title="Painel" description="Escolha o que aparece na visão geral" />
          <div className="space-y-3 px-5 pb-5">
            {(Object.keys(DASHBOARD_WIDGETS) as WidgetId[]).map((id) => (
              <Row key={id} label={DASHBOARD_WIDGETS[id]}>
                <Switch checked={settings.widgets[id]} onCheckedChange={() => toggleWidget(id)} aria-label={DASHBOARD_WIDGETS[id]} />
              </Row>
            ))}
          </div>
        </Card>

        <Card delay={0.09}>
          <CardHeader title="Fontes de dados" description="Situação das integrações neste servidor" />
          <ul className="px-5 pb-5">
            {status.data?.providers.map((p) => (
              <li key={p.name} className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
                <div>
                  <p className="text-[13px]">{p.name}</p>
                  <p className="text-2xs text-subtle">{p.detail}</p>
                </div>
                <Badge tone={p.configured ? "up" : "neutral"}>{p.configured ? "Ativo" : "Inativo"}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card delay={0.12} className="lg:col-span-2">
          <CardHeader title="Privacidade e dados (LGPD)" />
          <div className="grid gap-4 px-5 pb-5 md:grid-cols-[1fr_auto]">
            <div className="space-y-2 text-xs leading-relaxed text-muted">
              <p>Coletamos apenas o necessário para o funcionamento: nome exibido, respostas do questionário educacional, progresso nas lições, carteira registrada manualmente, favoritos e alertas.</p>
              <p>Não solicitamos credenciais de corretoras nem dados bancários. Chaves de provedores ficam somente no servidor. Você pode exportar ou apagar seus dados a qualquer momento.</p>
            </div>
            <div className="flex flex-wrap items-start gap-2 md:flex-col">
              <Button size="sm" onClick={exportData}><Download /> Exportar meus dados</Button>
              <Button size="sm" variant="danger" onClick={() => setConfirm(true)}><Trash2 /> Apagar todos os dados</Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm} title="Apagar todos os dados?" description="Perfil, progresso, carteira, alertas e notificações serão removidos deste navegador. Esta ação não pode ser desfeita.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button
            variant="danger"
            className="border border-down/40"
            onClick={() => {
              resetAll();
              setConfirm(false);
              router.replace("/bem-vindo");
            }}
          >
            Apagar definitivamente
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[13px]">{label}</p>
        {description && <p className="text-2xs text-subtle">{description}</p>}
      </div>
      {children}
    </div>
  );
}
