import { NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { addDays, formatShortDate, toDateISO } from "@/lib/dateUtils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const state = loadServerDormState(code);
  const members = state.members;

  if (members.length === 0) {
    return NextResponse.json({ error: "宿舍暂无成员，无法排班" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedStartUser = typeof body.startUser === "string" ? body.startUser.trim() : "";
  const currentIndex = members.findIndex((member) => member.name === state.todayDuty.user);
  const requestedIndex = members.findIndex((member) => member.name === requestedStartUser);
  const startIndex = requestedIndex >= 0 ? requestedIndex : currentIndex >= 0 ? currentIndex : 0;
  const today = new Date();

  const dutySchedule = members.map((_, offset) => {
    const date = addDays(today, offset);
    const member = members[(startIndex + offset) % members.length];

    return {
      date: toDateISO(date),
      dayLabel: offset === 0 ? "今天" : offset === 1 ? "明天" : `第${offset + 1}天`,
      shortDate: formatShortDate(date),
      itemCount: 1,
      statusLabel: offset === 0 ? "待完成" : "待值扫",
      isToday: offset === 0,
      user: member.name,
    };
  });

  state.dutySchedule = dutySchedule;
  state.todayDuty = {
    ...state.todayDuty,
    date: dutySchedule[0].date,
    user: dutySchedule[0].user,
    status: "未完成",
    suggestion: `${members.length}人轮换排班，本轮共${members.length}天`,
  };

  saveServerDormState(state);
  return NextResponse.json(state);
}
