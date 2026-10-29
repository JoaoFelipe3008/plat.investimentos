/**
 * Calendário econômico gerado por regras de recorrência conhecidas.
 * Não há API pública estável com as datas oficiais; por isso cada evento indica se é
 * recorrente (regra fixa) ou estimado, com link para o calendário oficial.
 * Para produção: integrar um provedor de calendário econômico licenciado.
 */
export interface EconEvent {
  date: string;
  title: string;
  region: "BR" | "EUA";
  kind: "recorrente" | "estimado";
  description: string;
  officialUrl: string;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstWeekday(year: number, month: number, weekday: number) {
  const d = new Date(year, month, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  return d;
}

function nextBusinessDay(d: Date) {
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

export function upcomingEvents(days = 35): EconEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today.getTime() + days * 86_400_000);
  const out: EconEvent[] = [];

  for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 1) {
      out.push({
        date: iso(d),
        title: "Boletim Focus",
        region: "BR",
        kind: "recorrente",
        description: "Expectativas do mercado para inflação, Selic, PIB e câmbio, publicadas pelo Banco Central às segundas-feiras.",
        officialUrl: "https://www.bcb.gov.br/publicacoes/focus",
      });
    }
  }

  for (let m = 0; m < 2; m++) {
    const y = today.getFullYear() + Math.floor((today.getMonth() + m) / 12);
    const mo = (today.getMonth() + m) % 12;
    const payroll = firstWeekday(y, mo, 5);
    const ipca = nextBusinessDay(new Date(y, mo, 10));
    for (const e of [
      {
        date: payroll,
        title: "Relatório de emprego (Payroll)",
        region: "EUA" as const,
        description: "Dados do mercado de trabalho americano, geralmente divulgados na primeira sexta-feira do mês.",
        officialUrl: "https://www.bls.gov/schedule/news_release/empsit.htm",
      },
      {
        date: ipca,
        title: "IPCA do mês anterior",
        region: "BR" as const,
        description: "Inflação oficial divulgada pelo IBGE, normalmente por volta do dia 10. Confirme a data no calendário do IBGE.",
        officialUrl: "https://www.ibge.gov.br/calendario-indicadores-novoportal.html",
      },
    ]) {
      if (e.date >= today && e.date <= end) out.push({ ...e, date: iso(e.date), kind: "estimado" });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const OFFICIAL_CALENDARS = [
  { label: "Reuniões do Copom (BCB)", url: "https://www.bcb.gov.br/publicacoes/atascopom" },
  { label: "Calendário de divulgações do IBGE", url: "https://www.ibge.gov.br/calendario-indicadores-novoportal.html" },
  { label: "Reuniões do FOMC (Federal Reserve)", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
];
