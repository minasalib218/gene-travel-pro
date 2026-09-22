import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireActivePass } from "@/lib/require-pass";
import { consumeTierAction } from "@/lib/tier-actions";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/access/canUseAi";
import { openai } from "@/lib/openai/server";

function uuidFallback() {
  return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ ok: false, code: "SUPABASE_AUTH_ERROR" }, { status: 401 });
    }
    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const planId = body?.planId;
    const idempotencyKey = body?.idempotencyKey || uuidFallback();

    if (!planId) {
      return NextResponse.json({ ok: false, code: "MISSING_PLAN_ID" }, { status: 400 });
    }

    const userId = data.user.id;
    const admin = await isAdmin(userId);

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
      select: { id: true, passId: true, inputsJson: true, recommendationJson: true, summaryJson: true },
    });

    if (!plan) {
      return NextResponse.json({ ok: false, code: "PLAN_NOT_FOUND" }, { status: 404 });
    }

    let remainingActions: number | null = null;

    if (!admin) {
      const passCheck = await requireActivePass(userId);
      if (!passCheck.ok || !passCheck.pass) {
        return NextResponse.json({ ok: false, code: "NO_ACTIVE_PASS" }, { status: 402 });
      }

      const charge = await consumeTierAction({
        userId,
        passId: passCheck.pass.id,
        actionType: "RUN_ANALYSIS",
        idempotencyKey,
      });

      if (!charge.ok) {
        return NextResponse.json({ ok: false, code: charge.code }, { status: 402 });
      }

      remainingActions = charge.remaining;
    }

    const analysisPrompt = {
      planId,
      destination: (plan.inputsJson as any)?.destination ?? null,
      inputs: plan.inputsJson ?? null,
      recommendation: plan.recommendationJson ?? null,
      summary: plan.summaryJson ?? null,
      instructions: [
        "Generate real analysis only from the provided trip data.",
        "Do not invent exact prices, weather, or legal guarantees.",
        "If data is missing, say it clearly and lower confidence.",
        "Return premium but concise analysis for booking fit, timing pressure, budget pressure, and visa-entry readiness.",
      ],
    };

    const ai = await openai.responses.create({
      model: "gpt-5",
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: `You are Gene Travel analysis AI.

Return strict JSON only in this shape:
{
  "summary": "string",
  "positiveDrivers": ["string"],
  "riskDrivers": ["string"],
  "budgetAnalysis": ["string"],
  "timingAnalysis": ["string"],
  "mobilityAnalysis": ["string"],
  "visaEntrySummary": "string",
  "warnings": ["string"],
  "confidence": 0
}

Use only the provided data:
${JSON.stringify(analysisPrompt)}`,
        },
      ],
    });

    const parsed = safeJson<{
      summary?: string;
      positiveDrivers?: string[];
      riskDrivers?: string[];
      budgetAnalysis?: string[];
      timingAnalysis?: string[];
      mobilityAnalysis?: string[];
      visaEntrySummary?: string;
      warnings?: string[];
      confidence?: number;
    }>(ai.output_text ?? "");

    const analysis = {
      generatedAt: new Date().toISOString(),
      promptInstructions: analysisPrompt.instructions,
      engines: {
        budget: {
          ok: true,
          notes: parsed?.budgetAnalysis ?? [],
        },
        timing: {
          ok: true,
          notes: parsed?.timingAnalysis ?? [],
        },
        mobility: {
          ok: true,
          notes: parsed?.mobilityAnalysis ?? [],
        },
      },
      features: [
        "AI Booking Fit Analysis",
        "AI Timing Pressure Review",
        "AI Mobility Review",
        "AI Visa & Entry Summary",
      ],
      aiSummary: parsed?.summary || "Analysis generated from available trip data.",
      positiveDrivers: parsed?.positiveDrivers ?? [],
      riskDrivers: parsed?.riskDrivers ?? [],
      visaEntrySummary: parsed?.visaEntrySummary ?? "",
      warnings: parsed?.warnings ?? [],
      confidence: typeof parsed?.confidence === "number" ? parsed.confidence : 62,
      inputsSnapshot: plan.inputsJson ?? null,
      adminBypass: admin ? true : undefined,
    };

    await prisma.plan.update({
      where: { id: planId },
      data: { analysisJson: analysis },
    });

    return NextResponse.json({
      ok: true,
      planId,
      remainingActions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Unable to run analysis right now." },
      { status: 500 },
    );
  }
}
