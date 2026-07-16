import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { getSession } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession();
  if (!session || session.dormCode !== code) {
    return NextResponse.json({ error: "请先登录当前宿舍" }, { status: 401 });
  }

  const { expenseId, memberName, action } = await request.json();
  const cleanAction = action === "confirm" || action === "reject" ? action : "submit";
  const targetMember = String(memberName || session.nickname).trim();

  const state = loadServerDormState(code);
  const expense = state.expenses.find((exp) => exp.id === expenseId);
  if (!expense) {
    return NextResponse.json({ error: "缴费记录不存在" }, { status: 404 });
  }

  if ((cleanAction === "confirm" || cleanAction === "reject") && expense.creator !== session.nickname) {
    return NextResponse.json({ error: "只有收款人可以确认收款" }, { status: 403 });
  }

  if (cleanAction === "submit" && targetMember !== session.nickname) {
    return NextResponse.json({ error: "只能提交自己的转账确认" }, { status: 403 });
  }

  state.expenses = state.expenses.map((exp) => {
    if (exp.id !== expenseId) return exp;
    return {
      ...exp,
      confirmations: exp.confirmations.map((c) => {
        if (c.member !== targetMember) return c;
        if (cleanAction === "confirm") {
          return { ...c, confirmed: true, status: "confirmed" };
        }
        if (cleanAction === "reject") {
          return { ...c, confirmed: false, status: "rejected" };
        }
        return {
          ...c,
          confirmed: false,
          status: "submitted",
          submittedAt: new Date().toISOString(),
        };
      }),
    };
  });
  saveServerDormState(state);
  return NextResponse.json(state);
}
