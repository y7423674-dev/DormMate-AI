import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, renameUser } from "@/lib/authStore";
import { renameDormMember, syncDormMemberDerivedState } from "@/lib/dormMembers";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { getSession, setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { nickname } = await request.json();
  const cleanNickname = String(nickname || "").trim();
  if (!cleanNickname) {
    return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
  }
  if (cleanNickname === session.nickname) {
    return NextResponse.json({
      session,
      state: loadServerDormState(session.dormCode),
    });
  }

  const existingUser = await getUserByUsername(cleanNickname);
  if (existingUser && existingUser.username !== session.nickname) {
    return NextResponse.json({ error: "该昵称已被使用" }, { status: 409 });
  }

  const state = loadServerDormState(session.dormCode);
  const renameError = renameDormMember(state, session.nickname, cleanNickname);
  if (renameError) {
    return NextResponse.json({ error: renameError }, { status: 409 });
  }
  syncDormMemberDerivedState(state);

  const renamedUser = await renameUser(session.nickname, cleanNickname);
  if (!renamedUser) {
    return NextResponse.json({ error: "该昵称已被使用" }, { status: 409 });
  }

  const nextSession = {
    ...session,
    nickname: cleanNickname,
    role: renamedUser.role,
  };
  await setSession(nextSession);
  saveServerDormState(state);

  return NextResponse.json({
    session: nextSession,
    state,
  });
}
