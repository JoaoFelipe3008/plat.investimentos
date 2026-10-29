import { NextResponse } from "next/server";
import { getMovers } from "@/lib/providers/market";

export async function GET() {
  return NextResponse.json(await getMovers(), { headers: { "Cache-Control": "private, max-age=120" } });
}
