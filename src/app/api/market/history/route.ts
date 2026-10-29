import { NextResponse } from "next/server";
import { z } from "zod";
import { ASSET_BY_SYMBOL } from "@/data/assets";
import { getHistory } from "@/lib/providers/market";

const Query = z.object({
  symbol: z.string().toUpperCase().refine((s) => ASSET_BY_SYMBOL.has(s)),
  range: z.enum(["1d", "5d", "1m", "6m", "1a", "5a"]).default("1m"),
});

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const parsed = Query.safeParse({ symbol: sp.get("symbol") ?? "", range: sp.get("range") ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  const history = await getHistory(parsed.data.symbol, parsed.data.range);
  return NextResponse.json(history, { headers: { "Cache-Control": "private, max-age=120" } });
}
