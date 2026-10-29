"use client";

import { BellOff, BellPlus, BellRing, CheckCheck, History, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CreateAlertDialog } from "@/components/alert-dialog";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Segmented, Switch } from "@/components/ui/interactive";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { describeAlert } from "@/lib/alerts";
import { formatDateTime, timeAgo } from "@/lib/format";
import { useApp, type Alert } from "@/lib/store";
import { cn } from "@/lib/utils";

const FREQ: Record<Alert["frequency"], string> = { uma_vez: "Uma vez", diario: "1× por dia", sempre: "Sempre (mín. 1 h)" };

function AlertsContent() {
  const alerts = useApp((s) => s.alerts);
  const notifications = useApp((s) => s.notifications);
  const log = useApp((s) => s.alertLog);
  const update = useApp((s) => s.updateAlert);
  const remove = useApp((s) => s.removeAlert);
  const markRead = useApp((s) => s.markRead);
  const removeNotification = useApp((s) => s.removeNotification);
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"todas" | "nao_lidas">("todas");

  useEffect(() => {
    if (params.get("novo") === "1") setOpen(true);
  }, [params]);

  const list = filter === "nao_lidas" ? notifications.filter((n) => !n.read) : notifications;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Alertas"
        description="Seja avisado sobre preços, variações, notícias de ativos favoritos e mudanças na Selic. Os alertas são avaliados enquanto o Lastro está aberto."
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <BellPlus /> Novo alerta
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader
            title="Central de notificações"
            description={`${unread} não ${unread === 1 ? "lida" : "lidas"}`}
            action={
              <div className="flex items-center gap-2">
                <Segmented value={filter} onChange={setFilter} options={[{ value: "todas", label: "Todas" }, { value: "nao_lidas", label: "Não lidas" }]} />
                {unread > 0 && (
                  <Button variant="ghost" size="icon-sm" onClick={() => markRead("all")} aria-label="Marcar todas como lidas">
                    <CheckCheck />
                  </Button>
                )}
              </div>
            }
          />
          {!list.length ? (
            <EmptyState icon={BellRing} title={filter === "nao_lidas" ? "Tudo lido" : "Nenhuma notificação"} description="Quando um alerta disparar, ele aparece aqui." />
          ) : (
            <ul>
              {list.map((n) => (
                <li key={n.id} className="group flex gap-3 border-t border-line px-5 py-3.5">
                  <button onClick={() => markRead(n.id)} className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-line-strong" : "bg-fg")} aria-label={n.read ? "Lida" : "Marcar como lida"} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[13px]", n.read ? "text-muted" : "font-medium")}>{n.title}</p>
                    <p className="mt-0.5 text-xs text-subtle">{n.body}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-2xs text-subtle">
                      <span>{timeAgo(n.createdAt)}</span>
                      {n.href && (
                        <button
                          className="text-muted hover:text-fg"
                          onClick={() => {
                            markRead(n.id);
                            if (n.href!.startsWith("http")) window.open(n.href, "_blank", "noopener");
                            else router.push(n.href!);
                          }}
                        >
                          Abrir
                        </button>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="opacity-60 group-hover:opacity-100" onClick={() => removeNotification(n.id)} aria-label="Excluir notificação">
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card delay={0.04}>
            <CardHeader title="Meus alertas" description={`${alerts.filter((a) => a.active).length} ativos de ${alerts.length}`} />
            {!alerts.length ? (
              <EmptyState icon={BellOff} title="Nenhum alerta" description="Exemplo: avise quando o Bitcoin passar de um preço ou quando a Selic mudar." action={<Button size="sm" onClick={() => setOpen(true)}>Criar alerta</Button>} />
            ) : (
              <ul>
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 border-t border-line px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[13px]", !a.active && "text-muted")}>{describeAlert(a)}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge>{FREQ[a.frequency]}</Badge>
                        {a.channels.push && <Badge>Navegador</Badge>}
                        {a.quietStart && <Badge tone="outline">Silêncio {a.quietStart}–{a.quietEnd}</Badge>}
                      </div>
                      {a.lastTriggeredAt && <p className="mt-1 text-2xs text-subtle">Último disparo: {formatDateTime(a.lastTriggeredAt)}</p>}
                    </div>
                    <Switch checked={a.active} onCheckedChange={(v) => update(a.id, { active: v, ...(v ? { lastTriggeredAt: a.frequency === "uma_vez" ? undefined : a.lastTriggeredAt } : {}) })} aria-label={a.active ? "Desativar alerta" : "Ativar alerta"} />
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(a.id)} aria-label="Excluir alerta"><Trash2 /></Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card delay={0.06}>
            <CardHeader title="Registro de disparos" />
            {!log.length ? (
              <EmptyState icon={History} title="Sem disparos registrados" className="py-6" />
            ) : (
              <ul className="max-h-72 overflow-y-auto">
                {log.slice(0, 50).map((e) => (
                  <li key={e.id} className="border-t border-line px-5 py-2.5">
                    <p className="text-xs">{e.detail}</p>
                    <p className="num text-2xs text-subtle">{formatDateTime(e.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <p className="px-1 text-2xs leading-relaxed text-subtle">
            Envio por e-mail e push com o app fechado exigem o job de alertas no servidor (estrutura pronta no banco: tabelas <code>alerts</code>, <code>alert_events</code> e <code>push_subscriptions</code>).
          </p>
        </div>
      </div>

      <CreateAlertDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o && params.get("novo")) router.replace("/alertas");
        }}
      />
    </>
  );
}

export default function AlertsPage() {
  return (
    <Suspense>
      <AlertsContent />
    </Suspense>
  );
}
