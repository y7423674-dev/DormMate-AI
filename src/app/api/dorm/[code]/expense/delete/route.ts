import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { expenseId, memberName } = await request.json();

  const state = loadServerDormState(code);
  const member = state.members.find((m) => m.name === memberName);
  if (member?.role !== "leader") {
    return NextResponse.json({ error: "只有舍长可以删除缴费记录" }, { status: 403 });
  }

  const expense = state.expenses.find((exp) => exp.id === expenseId);
  if (!expense) {
    return NextResponse.json({ error: "缴费记录不存在" }, { status: 404 });
  }

  state.expenses = state.expenses.filter((exp) => exp.id !== expenseId);
  state.utility = {
    ...state.utility,
    total: Math.max(0, Math.round((state.utility.total - expense.amount) * 100) / 100),
    perPerson: Math.max(
      0,
      Math.round(((state.utility.total - expense.amount) / Math.max(state.members.length, 1)) * 100) / 100
    ),
  };
  state.monthlyStats = {
    ...state.monthlyStats,
    utilityTotal: Math.max(0, Math.round((state.monthlyStats.utilityTotal - expense.amount) * 100) / 100),
  };

  saveServerDormState(state);
  return NextResponse.json(state);
}
