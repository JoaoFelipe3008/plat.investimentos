/** Log estruturado do cliente. Substitua por Sentry/OpenTelemetry em produção mantendo a assinatura. */
export function log(level: "info" | "warn" | "error", event: string, data?: Record<string, unknown>) {
  const payload = { level, event, at: new Date().toISOString(), ...data };
  if (level === "error") console.error("[lastro]", payload);
  else if (level === "warn") console.warn("[lastro]", payload);
  else if (process.env.NODE_ENV !== "production") console.info("[lastro]", payload);
}
