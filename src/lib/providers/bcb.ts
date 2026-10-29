import { z } from "zod";
import { bcbDateToISO, todayISO } from "@/lib/format";
import { cached, fetchJson } from "./http";

/**
 * Banco Central do Brasil — SGS (Sistema Gerenciador de Séries Temporais) e Olinda (Focus).
 * API pública e gratuita, sem chave. Dados oficiais com publicação diária/mensal.
 * Docs: https://dadosabertos.bcb.gov.br
 */
const SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

const SgsRow = z.object({ data: z.string(), valor: z.string() });
const SgsRows = z.array(SgsRow);

export interface SgsPoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
}

function parseRows(raw: unknown): SgsPoint[] {
  const today = todayISO();
  return SgsRows.parse(raw)
    .map((r) => ({ date: bcbDateToISO(r.data), value: Number(r.valor) }))
    .filter((p) => Number.isFinite(p.value) && p.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Últimos valores publicados (filtra datas futuras, como as da meta Selic). */
export function sgsLatest(series: number, n = 12) {
  return cached(`bcb:last:${series}:${n}`, 15 * 60_000, async () =>
    parseRows(await fetchJson("bcb", `${SGS}.${series}/dados/ultimos/${Math.min(n, 20)}?formato=json`, { perMinute: 60, timeoutMs: 15_000 })),
  );
}

function toBcbDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function sgsRange(series: number, days: number) {
  const end = new Date();
  // As séries diárias do SGS aceitam no máximo 10 anos por consulta.
  const start = new Date(end.getTime() - Math.min(days, 3650) * 86_400_000);
  const url = `${SGS}.${series}/dados?formato=json&dataInicial=${toBcbDate(start)}&dataFinal=${toBcbDate(end)}`;
  return cached(`bcb:range:${series}:${days}`, 60 * 60_000, async () =>
    parseRows(await fetchJson("bcb", url, { perMinute: 60, timeoutMs: 20_000 })),
  );
}

const FocusRow = z.object({
  Indicador: z.string(),
  Data: z.string(),
  DataReferencia: z.string(),
  Mediana: z.number().nullable(),
  baseCalculo: z.number(),
});

export function focusAnnual(year: number) {
  const filter = `(Indicador eq 'IPCA' or Indicador eq 'Selic' or Indicador eq 'PIB Total' or Indicador eq 'Câmbio') and DataReferencia eq '${year}' and baseCalculo eq 0`;
  const url =
    "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais" +
    `?$top=40&$orderby=Data%20desc&$format=json&$select=Indicador,Data,DataReferencia,Mediana,baseCalculo&$filter=${encodeURIComponent(filter)}`;
  return cached(`bcb:focus:${year}`, 6 * 60 * 60_000, async () => {
    const raw = await fetchJson<{ value: unknown[] }>("bcb-olinda", url, { perMinute: 20, timeoutMs: 12_000 });
    const rows = z.array(FocusRow).parse(raw.value);
    const pick = (name: string) => rows.find((r) => r.Indicador === name);
    const ipca = pick("IPCA");
    return {
      year,
      ipca: ipca?.Mediana ?? null,
      selic: pick("Selic")?.Mediana ?? null,
      pib: pick("PIB Total")?.Mediana ?? null,
      cambio: pick("Câmbio")?.Mediana ?? null,
      asOf: ipca?.Data ?? null,
    };
  });
}
