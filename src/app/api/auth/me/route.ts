import { NextResponse } from "next/server";
import { getUserByUsername, toUserSession } from "@/lib/authStore";
import { loadServerDormState } from "@/lib/serverStore";
import { getSession, setSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ session: null, state: null }, { status: 401 });
  }

  const user = await getUserByUsername(session.nickname);
  if (!user) {
    return NextResponse.json({ session: null, state: null }, { status: 401 });
  }

  const userSession = toUserSession(user);
  const state = loadServerDormState(userSession.dormCode);
  const member = state.members.find((item) => item.name === userSession.nickname);
  const currentSession = member && member.role !== userSession.role
    ? { ...userSession, role: member.role }
    : userSession;
  if (currentSession !== session) {
    await setSession(currentSession);
  }

  return NextResponse.json({
    session: currentSession,
    state,
  });
}
