import { prisma } from "@/lib/prisma";
import { tableExists } from "@/lib/prisma-safe";
import ReadyPlansList from "./ReadyPlansList";
import type { ReadyPlanRecord } from "./ReadyPlansEditor";

export const dynamic = "force-dynamic";

export default async function AdminReadyPlansPage() {
  let plans: ReadyPlanRecord[] = [];
  let dbError: string | null = null;

  try {
    const includeLinks = await tableExists("ready_plan_links");
    plans = (await prisma.readyPlan.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        destination: true,
        daysCount: true,
        heroImage: true,
        coverImage: true,
        priceFrom: true,
        currency: true,
        status: true,
        daysJson: true,
        updatedAt: true,
        ...(includeLinks
          ? {
              links: {
                orderBy: { sortOrder: "asc" },
              },
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    })) as ReadyPlanRecord[];
  } catch (error: any) {
    console.error("AdminReadyPlansPage database error:", error);
    dbError = error?.message || "Unknown database error";
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Ready Plans</h2>
        <p className="mt-2 text-sm text-white/60">
          Build the public ready-plan pages from here, including day-by-day timeline items, images, and affiliate links.
        </p>
      </div>

      {dbError ? (
        <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="text-base font-semibold">Database connection error</p>
          <p className="mt-2 text-sm text-red-200/80">
            The editor UI is ready, but Prisma could not read from the database.
          </p>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-black/30 p-4 text-xs text-red-100">
            {dbError}
          </pre>
        </div>
      ) : null}

      <ReadyPlansList initialPlans={plans} />
    </div>
  );
}
