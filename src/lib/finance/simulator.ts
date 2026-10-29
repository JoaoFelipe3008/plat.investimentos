/**
 * Simulação hipotética com capitalização mensal. Não é previsão nem promessa de retorno.
 */
export interface SimInput {
  initial: number;
  monthly: number;
  years: number;
  annualRate: number; // % a.a. bruto
  inflation: number; // % a.a.
  annualFee: number; // % a.a. (custódia/administração)
  applyIR: boolean; // tabela regressiva sobre o rendimento no resgate
}

export interface SimPoint {
  month: number;
  invested: number;
  nominal: number;
  real: number;
}

export interface SimResult {
  points: SimPoint[];
  invested: number;
  grossNominal: number;
  tax: number;
  netNominal: number;
  netReal: number;
  earnings: number;
}

export function irRate(days: number) {
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}

export function simulate(i: SimInput): SimResult {
  const months = Math.max(1, Math.round(i.years * 12));
  const net = (1 + i.annualRate / 100) / (1 + i.annualFee / 100) - 1;
  const r = Math.pow(1 + net, 1 / 12) - 1;
  const inf = Math.pow(1 + i.inflation / 100, 1 / 12) - 1;

  let balance = i.initial;
  let invested = i.initial;
  const points: SimPoint[] = [{ month: 0, invested, nominal: balance, real: balance }];
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + r) + i.monthly;
    invested += i.monthly;
    points.push({ month: m, invested, nominal: balance, real: balance / Math.pow(1 + inf, m) });
  }
  const earnings = balance - invested;
  // Simplificação: aplica a alíquota pelo prazo total (aportes mais recentes teriam alíquota maior).
  const tax = i.applyIR && earnings > 0 ? earnings * irRate(months * 30) : 0;
  const netNominal = balance - tax;
  return {
    points,
    invested,
    grossNominal: balance,
    tax,
    netNominal,
    netReal: netNominal / Math.pow(1 + inf, months),
    earnings: earnings - tax,
  };
}
