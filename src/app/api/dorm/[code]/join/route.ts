import { NextRequest, NextResponse } from "next/server";
import { addOrUpdateDormMember, syncDormMemberDerivedState } from "@/lib/dormMembers";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

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

  const state = await loadServerDormState(code);
  const memberError = addOrUpdateDormMember(state, cleanNickname, requestedRole);
  if (memberError) {
    return NextResponse.json({ error: memberError }, { status: 409 });
  }
  syncDormMemberDerivedState(state);

  await saveServerDormState(state);
  return NextResponse.json(state);
}