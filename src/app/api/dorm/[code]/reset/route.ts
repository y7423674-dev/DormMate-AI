import { NextResponse } from "next/server";
import { createDefaultDormState } from "@/data/mock";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

const DORM_MEMBER_LIMIT = 4;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const existingState = await loadServerDormState(code);
  const resetState = createDefaultDormState(code);
  const preservedMembers = existingState.members.length > 0
    ? existingState.members.slice(0, DORM_MEMBER_LIMIT)
    : resetState.members.slice(0, DORM_MEMBER_LIMIT);
  const dormMemberCount = DORM_MEMBER_LIMIT;

  resetState.members = preservedMembers.map((member, index) => ({
    ...member,
    id: member.id || String(index + 1),
    role: "member",
    avatarInitial: member.avatarInitial || member.name.slice(-1),
  }));
  resetState.utility = {
    ...resetState.utility,
    memberCount: dormMemberCount,
    perPerson: Math.round(resetState.utility.total / dormMemberCount),
    confirmedCount: Math.min(resetState.utility.confirmedCount, resetState.members.length),
  };
  resetState.announcements = resetState.announcements.map((announcement) => ({
    ...announcement,
    totalMembers: dormMemberCount,
    readCount: Math.min(announcement.readCount, resetState.members.length),
  }));
  resetState.expenses = resetState.expenses.map((expense) => ({
    ...expense,
    splitMethod: expense.splitMethod.includes("平摊") ? `${dormMemberCount}人平摊` : expense.splitMethod,
    perPerson: expense.splitMethod.includes("平摊")
      ? Math.round((expense.amount / dormMemberCount) * 100) / 100
      : expense.perPerson,
    confirmations: resetState.members.map((member) => ({
      member: member.name,
      confirmed: member.name === expense.creator,
      status: member.name === expense.creator ? "confirmed" : "unpaid",
    })),
  }));

  await saveServerDormState(resetState);
  return NextResponse.json(resetState);
}