import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateProviderData } from "@/lib/providers/aggregate";
import { openai } from "@/lib/openai/server";
import { buildGeneratePlanPrompt } from "@/lib/ai/prompts/generatePlan";
import { Prisma } from "@prisma/client";
import { createRouteClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { requireActivePass } from "@/lib/require-pass";
import { isAdmin } from "@/lib/access/canUseAi";

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

  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return NextResponse.json({ ok: false, code: "SUPABASE_AUTH_ERROR" }, { status: 401 });
  }
  if (!data?.user) {
    return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  }

  const userId = data.user.id;
  await ensureUserProfile(data.user, "AI_GENERATION_STARTED");

  if (!(await isAdmin(userId))) {
    const pass = await requireActivePass(userId);
    if (!pass.ok) {
      return NextResponse.json({ ok: false, code: pass.code }, { status: 402 });
    }
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

  // 3) Save only to the authenticated user's account.
  const recommendationJson = JSON.parse(
    JSON.stringify({ providerData, picks: planJson.picks }),
  ) as Prisma.InputJsonValue;
  const analysisJson = JSON.parse(
    JSON.stringify(planJson.analysis ?? null),
  ) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  const summaryJson = JSON.parse(
    JSON.stringify({ timeline: planJson.timeline }),
  ) as Prisma.InputJsonValue;
  const plan = await prisma.plan.create({
    data: {
      userId,
      title: body?.title ?? "My Gene Smart Plan",
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      inputsJson: JSON.parse(JSON.stringify(inputs)) as Prisma.InputJsonValue,
      recommendationJson,
      analysisJson,
      summaryJson,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, planId: plan.id });
}
