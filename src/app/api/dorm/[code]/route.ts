import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

// GET: load dorm state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const state = loadServerDormState(code);
  return NextResponse.json(state);
}

// PUT: update entire dorm state
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const state = await request.json();
  saveServerDormState(state);
  return NextResponse.json(state);
}