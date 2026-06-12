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
  const requestedRole = role === "leader" ? "leader" : "member";
  if (!cleanNickname) {
    return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
  }

  const state = loadServerDormState(code);
  const existingLeader = state.members.find(
    (member) => member.role === "leader" && member.name !== cleanNickname
  );

  if (requestedRole === "leader" && existingLeader) {
    return NextResponse.json(
      { error: `舍长身份已被${existingLeader.name}占用，请以舍友身份加入` },
      { status: 409 }
    );
  }

  // Add member if not already present
  const existingIndex = state.members.findIndex((m) => m.name === cleanNickname);
  if (existingIndex === -1) {
    if (state.members.length >= DORM_MEMBER_LIMIT) {
      return NextResponse.json({ error: "宿舍人数已满，最多登记4人" }, { status: 409 });
    }
    state.members.push({
      id: String(state.members.length + 1),
      name: cleanNickname,
      role: requestedRole,
      status: "",
      avatarInitial: cleanNickname.slice(-1),
    });
  } else {
    state.members[existingIndex] = {
      ...state.members[existingIndex],
      role: requestedRole,
    };
  }

  saveServerDormState(state);
  return NextResponse.json(state);
}
