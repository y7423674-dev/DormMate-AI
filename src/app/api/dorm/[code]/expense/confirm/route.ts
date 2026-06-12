import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { expenseId, memberName } = await request.json();

  const state = loadServerDormState(code);
  state.expenses = state.expenses.map((exp) => {
    if (exp.id !== expenseId) return exp;
    return {
      ...exp,
      confirmations: exp.confirmations.map((c) =>
        c.member === memberName ? { ...c, confirmed: true } : c
      ),
    };
  });
  saveServerDormState(state);
  return NextResponse.json(state);
}