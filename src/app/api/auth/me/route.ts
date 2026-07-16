import { NextResponse } from "next/server";
import { loadServerDormState } from "@/lib/serverStore";
import { getSession, setSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ session: null, state: null }, { status: 401 });
  }

  const state = loadServerDormState(session.dormCode);
  const member = state.members.find((item) => item.name === session.nickname);
  const currentSession = member && member.role !== session.role
    ? { ...session, role: member.role }
    : session;
  if (currentSession !== session) {
    await setSession(currentSession);
  }

  return NextResponse.json({
    session: currentSession,
    state,
  });
}
