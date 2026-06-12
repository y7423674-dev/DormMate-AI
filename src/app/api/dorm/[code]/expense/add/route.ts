import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import type { ExpenseRecord, ExpenseShare } from "@/data/types";
import { formatMonthDay, toDateISO } from "@/lib/dateUtils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { title, amount, creator, note, splitMethod, splitShares } = await request.json();

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
  const isRatio = splitMethod === "ratio";
  const amountRounded = Math.round(parsedAmount * 100) / 100;
  const ratioShares: ExpenseShare[] = isRatio
    ? state.members
        .map((member) => {
          const ratio = Number(splitShares?.[member.name] || 0);
          return {
            member: member.name,
            ratio: Number.isFinite(ratio) && ratio > 0 ? Math.round(ratio * 100) / 100 : 0,
            amount: 0,
          };
        })
        .filter((share) => share.ratio > 0)
    : [];
  const ratioTotal = Math.round(ratioShares.reduce((sum, share) => sum + share.ratio, 0) * 100) / 100;

  if (isRatio && (ratioShares.length === 0 || ratioTotal > 100)) {
    return NextResponse.json({ error: "按比例收费的总比例必须大于0且不超过100%" }, { status: 400 });
  }

  const finalRatioShares = ratioShares.map((share) => ({
    ...share,
    amount: Math.round(amountRounded * (share.ratio / 100) * 100) / 100,
  }));
  const perPerson = isCreatorOnly
    ? amountRounded
    : isRatio
      ? 0
      : Math.round((amountRounded / memberCount) * 100) / 100;

  const newExpense: ExpenseRecord = {
    id: `exp-${Date.now()}`,
    title: cleanTitle,
    amount: amountRounded,
    creator: cleanCreator,
    splitMethod: isCreatorOnly ? "个人支付" : isRatio ? `按比例收费（${ratioTotal}%）` : `${memberCount}人平摊`,
    perPerson,
    splitShares: isRatio ? finalRatioShares : undefined,
    note: cleanNote || "无备注",
    date: formatMonthDay(),
    dateISO: toDateISO(),
    confirmations: state.members.map((member) => ({
      member: member.name,
      confirmed: isCreatorOnly || member.name === cleanCreator || (isRatio && !finalRatioShares.some((share) => share.member === member.name)),
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
