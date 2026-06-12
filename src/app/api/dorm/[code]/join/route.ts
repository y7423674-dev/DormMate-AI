import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

const DORM_MEMBER_LIMIT = 4;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { nickname, role } = await request.json();
  const cleanNickname = String(nickname || "").trim();
  if (!cleanNickname) {
    return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
  }

  const state = loadServerDormState(code);

  // Add member if not already present
  const existing = state.members.find((m) => m.name === cleanNickname);
  if (!existing) {
    if (state.members.length >= DORM_MEMBER_LIMIT) {
      return NextResponse.json({ error: "宿舍人数已满，最多登记4人" }, { status: 409 });
    }
    state.members.push({
      id: String(state.members.length + 1),
      name: cleanNickname,
      role: role || "member",
      status: "",
      avatarInitial: cleanNickname.slice(-1),
    });
  }

  saveServerDormState(state);
  return NextResponse.json(state);
}
