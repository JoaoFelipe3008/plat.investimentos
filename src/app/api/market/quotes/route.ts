import { NextResponse } from "next/server";
import { z } from "zod";
import { ASSET_BY_SYMBOL } from "@/data/assets";
import { getQuotes } from "@/lib/providers/market";

const Query = z.object({
  symbols: z
    .string()
    .transform((s) => [...new Set(s.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean))])
    .pipe(z.array(z.string().refine((s) => ASSET_BY_SYMBOL.has(s), "Ativo desconhecido")).min(1).max(40)),
});

export async function GET(req: Request) {
  const parsed = Query.safeParse({ symbols: new URL(req.url).searchParams.get("symbols") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: "Parâmetro 'symbols' inválido" }, { status: 400 });
  const quotes = await getQuotes(parsed.data.symbols);
  return NextResponse.json({ quotes }, { headers: { "Cache-Control": "private, max-age=30" } });
}
