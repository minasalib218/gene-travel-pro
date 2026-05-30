import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateProviderData } from "@/lib/providers/aggregate";
import { openai } from "@/lib/openai/server";
import { buildGeneratePlanPrompt } from "@/lib/ai/prompts/generatePlan";

function safeJson<T>(text: string): T | null {
  try { return JSON.parse(text) as T; } catch { return null; }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const destination = String(body?.destination ?? "");
  const startDate = String(body?.startDate ?? "");
  const endDate = String(body?.endDate ?? "");
  const budget = Number(body?.budget ?? 0);
  const currency = String(body?.currency ?? "USD");
  const inputs = body?.inputs ?? body;

  if (!destination || !startDate || !endDate) {
    return NextResponse.json({ ok: false, code: "MISSING_INPUTS" }, { status: 400 });
  }

  // ✅ 1) Provider data (affiliate APIs)
  const providerData = await aggregateProviderData({ destination, startDate, endDate, budget, currency });

  if (!providerData.hotels.length && !providerData.activities.length) {
    return NextResponse.json({ ok: false, code: "NO_PROVIDER_RESULTS" }, { status: 502 });
  }

  // ✅ 2) OpenAI ranks + builds timeline (JSON)
  const promptPayload = { destination, startDate, endDate, budget, currency, inputs, providerData };

  const ai = await openai.responses.create({
    model: "gpt-5",
    reasoning: { effort: "low" },
    input: [{ role: "user", content: buildGeneratePlanPrompt(promptPayload) }],
  });

  const out = ai.output_text ?? "";
  const planJson = safeJson<any>(out);

  if (!planJson?.picks || !planJson?.timeline) {
    return NextResponse.json({ ok: false, code: "AI_BAD_JSON" }, { status: 500 });
  }

  // ✅ 3) Save in DB (for now: use a fixed userId or your auth later)
  const userId = body?.userId ?? "trial-admin"; // later: supabase user
  const plan = await prisma.plan.create({
    data: {
      userId,
      title: body?.title ?? "My Gene Smart Plan",
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      inputsJson: inputs,
      recommendationJson: { providerData, picks: planJson.picks },
      analysisJson: planJson.analysis ?? null,
      summaryJson: { timeline: planJson.timeline },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, planId: plan.id });
}