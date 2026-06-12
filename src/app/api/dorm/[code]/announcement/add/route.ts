import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
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
  const { title, content, author } = await request.json();

  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  const cleanAuthor = String(author || "舍友").trim();

  if (!cleanTitle || !cleanContent) {
    return NextResponse.json({ error: "公告标题和内容不能为空" }, { status: 400 });
  }

  const state = loadServerDormState(code);
  const announcement: Announcement = {
    id: `ann-${Date.now()}`,
    title: cleanTitle,
    content: cleanContent,
    author: cleanAuthor,
    date: formatDate(),
    pinned: true,
    readCount: 1,
    totalMembers: state.members.length,
    readByMe: true,
  };

  state.announcements = [
    announcement,
    ...state.announcements.map((item) => ({ ...item, pinned: false })),
  ];

  saveServerDormState(state);
  return NextResponse.json(state);
}
