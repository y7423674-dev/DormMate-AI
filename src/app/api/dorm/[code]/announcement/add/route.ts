import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { getSession } from "@/lib/session";
import type { Announcement } from "@/data/types";

function formatDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession();
  if (!session || session.dormCode !== code) {
    return NextResponse.json({ error: "请先登录当前宿舍" }, { status: 401 });
  }

  const { title, content, pinned } = await request.json();

  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();

  if (!cleanTitle || !cleanContent) {
    return NextResponse.json({ error: "公告标题和内容不能为空" }, { status: 400 });
  }

  const state = await loadServerDormState(code);
  const authorMember = state.members.find((member) => member.name === session.nickname);
  const canPin = authorMember?.role === "leader";
  const shouldPin = pinned === true;
  if (shouldPin && !canPin) {
    return NextResponse.json({ error: "只有舍长可以置顶公告" }, { status: 403 });
  }

  const announcement: Announcement = {
    id: `ann-${Date.now()}`,
    title: cleanTitle,
    content: cleanContent,
    author: session.nickname,
    date: formatDate(),
    pinned: shouldPin,
    readCount: 1,
    totalMembers: state.members.length,
    readByMe: true,
  };

  state.announcements = shouldPin
    ? [announcement, ...state.announcements.map((item) => ({ ...item, pinned: false }))]
    : [announcement, ...state.announcements];

  await saveServerDormState(state);
  return NextResponse.json(state);
}