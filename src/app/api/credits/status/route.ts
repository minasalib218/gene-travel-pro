import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/credits/creditService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const status = await getCreditStatus(data.user.id);
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("credit status route error:", error);
    return NextResponse.json({ error: "Unable to load credit status." }, { status: 400 });
  }
}
