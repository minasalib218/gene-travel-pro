import { NextResponse } from "next/server";
import { plans } from "@/lib/mockData";
export async function GET(){ return NextResponse.json({plans}); }
