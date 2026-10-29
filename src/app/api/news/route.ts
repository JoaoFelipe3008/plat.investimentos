import { NextResponse } from "next/server";
import { getNews } from "@/lib/providers/news";

export async function GET() {
  return NextResponse.json(await getNews(), { headers: { "Cache-Control": "private, max-age=300" } });
}
