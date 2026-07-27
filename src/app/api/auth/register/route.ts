import { NextRequest, NextResponse } from "next/server";
import { createEmptyDormState } from "@/data/mock";
import { createUser, getUserByUsername, getUserCountByDormCode, toUserSession } from "@/lib/authStore";
import { addOrUpdateDormMember, syncDormMemberDerivedState } from "@/lib/dormMembers";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { setSession } from "@/lib/session";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, dormCode, role } = await request.json();
    const cleanUsername = String(username || "").trim();
    const cleanPassword = String(password || "");
    const cleanDormCode = String(dormCode || "").trim();
    const requestedRole = role === "leader" ? "leader" : "member";
    console.log("REGISTER PARAMS:", {
      username: cleanUsername,
      passwordLength: cleanPassword.length,
      dormCode: cleanDormCode,
      role: requestedRole,
    });

    if (!cleanUsername) {
      return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
    }
    if (cleanPassword.length < 6) {
      return NextResponse.json({ error: "密码至少需要 6 位" }, { status: 400 });
    }
    if (!cleanDormCode) {
      return NextResponse.json({ error: "宿舍邀请码不能为空" }, { status: 400 });
    }
    const existingUser = await getUserByUsername(cleanUsername);
    console.log("REGISTER getUserByUsername RESULT:", existingUser);
    if (existingUser) {
      return NextResponse.json({ error: "这个昵称已经注册，请直接登录" }, { status: 409 });
    }

    const isFirstDormUser = await getUserCountByDormCode(cleanDormCode) === 0;
    const state = isFirstDormUser
      ? createEmptyDormState(cleanDormCode)
      : await loadServerDormState(cleanDormCode);

    const memberError = addOrUpdateDormMember(state, cleanUsername, requestedRole);
    if (memberError) {
      return NextResponse.json({ error: memberError }, { status: 409 });
    }
    syncDormMemberDerivedState(state);

    console.log("REGISTER createUser INPUT:", {
      username: cleanUsername,
      dormCode: cleanDormCode,
      role: requestedRole,
    });
    const user = await createUser(cleanUsername, cleanPassword, cleanDormCode, requestedRole);
    console.log("REGISTER createUser RESULT:", user);

    const saveResult = await saveServerDormState(state);
    console.log("REGISTER saveServerDormState RESULT:", saveResult);

    const session = toUserSession(user);
    await setSession(session);

    return NextResponse.json({ session, state });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      ("details" in error || "hint" in error || "code" in error)
    ) {
      console.error("REGISTER SUPABASE ERROR MESSAGE:", error.message);
      console.error("REGISTER SUPABASE ERROR DETAILS:", "details" in error ? error.details : undefined);
      console.error("REGISTER SUPABASE ERROR HINT:", "hint" in error ? error.hint : undefined);
      console.error("REGISTER SUPABASE ERROR CODE:", "code" in error ? error.code : undefined);
    }

    return Response.json(
      {
        error: getErrorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}