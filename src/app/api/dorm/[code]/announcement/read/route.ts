import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { announcementId } = await request.json();

  const state = loadServerDormState(code);
  state.announcements = state.announcements.map((a) =>
    a.id === announcementId
      ? { ...a, readByMe: true, readCount: a.readCount + 1 }
      : a
  );
  saveServerDormState(state);
  return NextResponse.json(state);
}