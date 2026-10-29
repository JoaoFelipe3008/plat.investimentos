"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { ASSETS, getAsset } from "@/data/assets";
import { useQuotes } from "@/hooks/use-market";
import { ALERT_KIND_LABEL } from "@/lib/alerts";
import { useApp, type Alert, type AlertKind } from "@/lib/store";
import { Button } from "./ui/button";
import { Dialog, Switch, Tooltip } from "./ui/interactive";
import { Field, Input, Select } from "./ui/primitives";
import { formatAssetValue } from "./market";

const Schema = z
  .object({
    kind: z.enum(["preco_acima", "preco_abaixo", "variacao", "noticia", "selic"]),
    symbol: z.string().optional(),
    threshold: z.number().positive().optional(),
    frequency: z.enum(["uma_vez", "diario", "sempre"]),
  })
  .refine((a) => a.kind === "selic" || !!a.symbol, { message: "Escolha um ativo" })
  .refine((a) => !["preco_acima", "preco_abaixo", "variacao"].includes(a.kind) || a.threshold != null, { message: "Informe um valor" });

const ALERTABLE = ASSETS.filter((a) => a.provider.kind !== "benchmark" && a.category !== "macro");

export function CreateAlertDialog({ open, onOpenChange, defaultSymbol }: { open: boolean; onOpenChange: (o: boolean) => void; defaultSymbol?: string }) {
  const addAlert = useApp((s) => s.addAlert);
  const alerts = useApp((s) => s.alerts);
  const [kind, setKind] = useState<AlertKind>("preco_acima");
  const [symbol, setSymbol] = useState(defaultSymbol && getAsset(defaultSymbol)?.provider.kind !== "benchmark" ? defaultSymbol : "BTC");
  const [threshold, setThreshold] = useState("");
  const [frequency, setFrequency] = useState<Alert["frequency"]>("uma_vez");
  const [push, setPush] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const { data: quotes } = useQuotes(symbol ? [symbol] : []);
  const asset = getAsset(symbol);
  const current = quotes?.[symbol]?.price;

  useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, [open]);

  useEffect(() => {
    if (open && defaultSymbol && ALERTABLE.some((a) => a.symbol === defaultSymbol)) setSymbol(defaultSymbol);
  }, [open, defaultSymbol]);

  const askPush = async (on: boolean) => {
    if (!on) return setPush(false);
    if (permission === "unsupported") return;
    const p = permission === "granted" ? "granted" : await Notification.requestPermission();
    setPermission(p);
    setPush(p === "granted");
  };

  const needsThreshold = kind === "preco_acima" || kind === "preco_abaixo" || kind === "variacao";

  const submit = () => {
    const parsed = Schema.safeParse({
      kind,
      symbol: kind === "selic" ? undefined : symbol,
      threshold: needsThreshold ? Number(threshold.replace(",", ".")) || undefined : undefined,
      frequency,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Verifique os campos");
    const dup = alerts.find((a) => a.active && a.kind === parsed.data.kind && a.symbol === parsed.data.symbol && a.threshold === parsed.data.threshold);
    if (dup) return setError("Você já tem um alerta ativo idêntico.");
    addAlert({
      ...parsed.data,
      channels: { app: true, push, email: false },
      quietStart: quiet ? quietStart : undefined,
      quietEnd: quiet ? quietEnd : undefined,
    });
    setError(null);
    setThreshold("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Novo alerta" description="Avisamos quando a condição for atendida, sem disparos duplicados.">
      <div className="space-y-4">
        <Field label="Tipo de alerta">
          <Select value={kind} onChange={(e) => setKind(e.target.value as AlertKind)}>
            {(Object.keys(ALERT_KIND_LABEL) as AlertKind[]).map((k) => (
              <option key={k} value={k}>
                {ALERT_KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </Field>

        {kind !== "selic" && (
          <Field label="Ativo">
            <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {ALERTABLE.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol} — {a.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {needsThreshold && (
          <Field
            label={kind === "variacao" ? "Variação mínima (%)" : `Preço (${asset?.unit === "USD" ? "US$" : asset?.unit === "PTS" ? "pontos" : "R$"})`}
            hint={current != null ? `Cotação atual: ${formatAssetValue(asset, current)}` : "Cotação atual indisponível para este ativo; o alerta só dispara quando houver dado da fonte."}
          >
            <Input inputMode="decimal" placeholder={kind === "variacao" ? "3" : "0,00"} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </Field>
        )}

        <Field label="Frequência">
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Alert["frequency"])}>
            <option value="uma_vez">Uma vez (desativa após disparar)</option>
            <option value="diario">No máximo uma vez por dia</option>
            <option value="sempre">Sempre que ocorrer (intervalo mínimo de 1 hora)</option>
          </Select>
        </Field>

        <div className="space-y-3 rounded-md border border-line p-3">
          <p className="text-xs font-medium text-muted">Canais</p>
          <Row label="Na plataforma" description="Central de notificações">
            <Switch checked disabled aria-label="Na plataforma (sempre ativo)" />
          </Row>
          <Row
            label="Notificação do navegador"
            description={
              permission === "unsupported"
                ? "Não suportado neste navegador"
                : permission === "denied"
                  ? "Permissão negada nas configurações do navegador"
                  : "Enquanto o Lastro estiver aberto"
            }
          >
            <Switch checked={push} onCheckedChange={askPush} disabled={permission === "unsupported" || permission === "denied"} aria-label="Notificação do navegador" />
          </Row>
          <Row label="E-mail" description="Requer o job de alertas no servidor (próxima etapa)">
            <Tooltip content="O envio por e-mail depende de um job no servidor com provedor de e-mail. A estrutura (tabela alert_events) já está no esquema do banco.">
              <span>
                <Switch checked={false} disabled aria-label="E-mail (indisponível)" />
              </span>
            </Tooltip>
          </Row>
          <Row label="Horário de silêncio" description="Sem notificações do navegador neste intervalo">
            <Switch checked={quiet} onCheckedChange={setQuiet} aria-label="Horário de silêncio" />
          </Row>
          {quiet && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="De">
                <Input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} />
              </Field>
              <Field label="Até">
                <Input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-down">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit}>
            Criar alerta
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[13px] text-fg">{label}</p>
        {description && <p className="text-2xs text-subtle">{description}</p>}
      </div>
      {children}
    </div>
  );
}
