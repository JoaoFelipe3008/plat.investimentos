import { NextResponse } from "next/server";
import { getMacro } from "@/lib/providers/market";

export async function GET() {
  return NextResponse.json(await getMacro(), { headers: { "Cache-Control": "private, max-age=300" } });
}
