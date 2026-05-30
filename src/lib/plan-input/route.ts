import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planInputSchema } from "@/lib/validations/plan-input";
import { mapPlanInputToPrisma } from "@/lib/plan-input/mapper";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = planInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const planInput = await prisma.planInput.create({
      data: mapPlanInputToPrisma(parsed.data),
    });

    return NextResponse.json({ ok: true, planInput });
  } catch (error) {
    console.error("POST /api/plan-inputs error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}