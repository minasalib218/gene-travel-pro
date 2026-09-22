import { NextResponse } from "next/server";
import { plans } from "@/lib/mockData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(){ return NextResponse.json({plans}); }
