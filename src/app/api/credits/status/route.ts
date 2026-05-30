import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/credits/creditService";

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
    const message = error instanceof Error ? error.message : "Unable to load credit status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
