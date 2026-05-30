import { NextResponse } from "next/server";
import { dataService } from "@/lib/services/dataService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sectionType = String(body?.sectionType ?? "");
    const query = String(body?.query ?? "");

    // MVP: return activities for any section
    const results = await dataService.searchActivities({
      destination: "any",
      query,
    });

    return NextResponse.json({
      ok: true,
      results: results.map((r) => ({
        id: r.id,
        title: r.title,
        image: r.imageUrl ?? undefined,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Search failed" }, { status: 500 });
  }
}
