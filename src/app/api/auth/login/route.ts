import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, toUserSession } from "@/lib/authStore";
import { loadServerDormState } from "@/lib/serverStore";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanUsername || !cleanPassword) {
    return NextResponse.json({ error: "请输入昵称和密码" }, { status: 400 });
  }

  const user = await authenticateUser(cleanUsername, cleanPassword);
  if (!user) {
    return NextResponse.json({ error: "昵称或密码不正确" }, { status: 401 });
  }

  const session = toUserSession(user);
  await setSession(session);

  return NextResponse.json({
    session,
    state: loadServerDormState(session.dormCode),
  });
}
