import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { applyAiActions } from "@/lib/aiEngine";
import type { AiAction } from "@/data/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { swapType, userName, targetMember } = await request.json();

  const state = loadServerDormState(code);

  let actions: AiAction[];
  if (swapType === "exchange") {
    if (!targetMember) {
      return NextResponse.json({ error: "请选择交换舍友" }, { status: 400 });
    }
    actions = [
      { type: "change_duty", date: "明天", from: userName, to: targetMember },
      { type: "add_ai_log", input: `换班：${userName}和${targetMember}交换值扫`, reply: `已交换：${userName}和${targetMember}互换值扫。` },
    ];
  } else {
    actions = [
      { type: "add_makeup_task", date: "后天", user: userName },
      { type: "add_ai_log", input: `补扫：${userName}申请补扫`, reply: `已安排：${userName}本次请假，后续补扫一次。` },
    ];
  }

  const newState = applyAiActions(state, actions);
  saveServerDormState(newState);
  return NextResponse.json(newState);
}
