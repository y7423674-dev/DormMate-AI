import { NextRequest, NextResponse } from "next/server";
import { createEmptyDormState } from "@/data/mock";
import { createUser, getUserByUsername, getUserCountByDormCode, toUserSession } from "@/lib/authStore";
import { addOrUpdateDormMember, syncDormMemberDerivedState } from "@/lib/dormMembers";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { username, password, dormCode, role } = await request.json();
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");
  const cleanDormCode = String(dormCode || "").trim();
  const requestedRole = role === "leader" ? "leader" : "member";

  if (!cleanUsername) {
    return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
  }
  if (cleanPassword.length < 6) {
    return NextResponse.json({ error: "密码至少需要 6 位" }, { status: 400 });
  }
  if (!cleanDormCode) {
    return NextResponse.json({ error: "宿舍邀请码不能为空" }, { status: 400 });
  }
  if (getUserByUsername(cleanUsername)) {
    return NextResponse.json({ error: "这个昵称已经注册，请直接登录" }, { status: 409 });
  }

  const isFirstDormUser = getUserCountByDormCode(cleanDormCode) === 0;
  const state = isFirstDormUser
    ? createEmptyDormState(cleanDormCode)
    : loadServerDormState(cleanDormCode);

  const memberError = addOrUpdateDormMember(state, cleanUsername, requestedRole);
  if (memberError) {
    return NextResponse.json({ error: memberError }, { status: 409 });
  }
  syncDormMemberDerivedState(state);

  const user = await createUser(cleanUsername, cleanPassword, cleanDormCode, requestedRole);
  saveServerDormState(state);

  const session = toUserSession(user);
  await setSession(session);

  return NextResponse.json({ session, state });
}
