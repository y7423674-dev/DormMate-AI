import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import type { ExpenseRecord } from "@/data/types";

function formatDate() {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { title, amount, creator, note, splitMethod } = await request.json();

  const cleanTitle = String(title || "").trim();
  const cleanCreator = String(creator || "").trim();
  const cleanNote = String(note || "").trim();
  const parsedAmount = Number(amount);

  if (!cleanTitle || !cleanCreator || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "支出标题、金额和创建者不能为空" }, { status: 400 });
  }

  const state = loadServerDormState(code);
  const memberCount = Math.max(state.members.length, 1);
  const isCreatorOnly = splitMethod === "creatorOnly";
  const perPerson = isCreatorOnly
    ? Math.round(parsedAmount * 100) / 100
    : Math.round((parsedAmount / memberCount) * 100) / 100;

  const newExpense: ExpenseRecord = {
    id: `exp-${Date.now()}`,
    title: cleanTitle,
    amount: Math.round(parsedAmount * 100) / 100,
    creator: cleanCreator,
    splitMethod: isCreatorOnly ? "个人支付" : `${memberCount}人平摊`,
    perPerson,
    note: cleanNote || "无备注",
    date: formatDate(),
    confirmations: state.members.map((member) => ({
      member: member.name,
      confirmed: isCreatorOnly || member.name === cleanCreator,
    })),
  };

  state.expenses = [newExpense, ...state.expenses];
  state.utility = {
    ...state.utility,
    total: Math.round((state.utility.total + newExpense.amount) * 100) / 100,
    perPerson: Math.round(((state.utility.total + newExpense.amount) / memberCount) * 100) / 100,
  };
  state.monthlyStats = {
    ...state.monthlyStats,
    utilityTotal: Math.round((state.monthlyStats.utilityTotal + newExpense.amount) * 100) / 100,
  };

  saveServerDormState(state);
  return NextResponse.json(state);
}
