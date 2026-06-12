import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userName } = await request.json();
  const state = loadServerDormState(code);
  if (state.todayDuty.user !== userName) {
    return NextResponse.json({ error: "只能完成自己的值日任务" }, { status: 403 });
  }
  state.todayDuty = { ...state.todayDuty, status: "已完成" };
  saveServerDormState(state);
  return NextResponse.json(state);
}
