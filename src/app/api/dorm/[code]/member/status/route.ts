import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userName, status } = await request.json();
  const cleanUserName = String(userName || "").trim();
  const cleanStatus = String(status || "").trim();

  if (!cleanUserName || !cleanStatus) {
    return NextResponse.json({ error: "状态信息不完整" }, { status: 400 });
  }
  if ([...cleanStatus].length > 4) {
    return NextResponse.json({ error: "状态不能超过四字" }, { status: 400 });
  }

  const state = loadServerDormState(code);
  const memberIndex = state.members.findIndex((member) => member.name === cleanUserName);
  if (memberIndex === -1) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  state.members[memberIndex] = {
    ...state.members[memberIndex],
    status: cleanStatus,
  };

  saveServerDormState(state);
  return NextResponse.json(state);
}
