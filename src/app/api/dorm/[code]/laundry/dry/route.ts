import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userName, type, collectTime } = await request.json();

  const state = await loadServerDormState(code);
  if (!userName || !type || !collectTime) {
    return NextResponse.json({ error: "晾晒信息不完整" }, { status: 400 });
  }

  if (state.balcony.slots.length >= state.balcony.totalSlots) {
    return NextResponse.json({ error: "阳台位置已满" }, { status: 409 });
  }

  state.balcony = {
    ...state.balcony,
    slots: [...state.balcony.slots, { user: userName, type, collectTime, status: "晾晒中" }],
  };
  await saveServerDormState(state);
  return NextResponse.json(state);
}