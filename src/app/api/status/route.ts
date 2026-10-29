import { NextResponse } from "next/server";
import { env } from "@/lib/providers/http";

/** Informa apenas SE cada integração está configurada — nunca expõe valores de chaves. */
export async function GET() {
  return NextResponse.json({
    providers: [
      { name: "Banco Central do Brasil", configured: true, detail: "API pública, sem chave" },
      { name: "CoinGecko", configured: true, detail: env.coingeckoKey ? "Plano Demo (chave configurada)" : "API pública (limites menores)" },
      { name: "Brapi", configured: !!env.brapiToken, detail: env.brapiToken ? "Token configurado" : "Sem token: apenas PETR4, VALE3, ITUB4 e MGLU3" },
      { name: "Finnhub", configured: !!env.finnhubKey, detail: env.finnhubKey ? "Chave configurada" : "Não configurado: ações dos EUA e notícias globais indisponíveis" },
      { name: "Agência Brasil (RSS)", configured: true, detail: "Feed público" },
    ],
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
