import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { processAiMessage } from "@/data/mockAi";
import { applyAiActions } from "@/lib/aiEngine";
import type { AiResponse } from "@/data/types";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

function buildSystemPrompt(
  userName: string,
  dormCode: string,
  memberNames: string[],
  todayDutyUser: string,
  memberCount: number
): string {
  return `你是 DormMate AI，一个宿舍协作助手。你的任务是理解用户的自然语言输入，识别用户意图，并返回结构化的操作指令来更新宿舍看板。

当前宿舍信息：
- 宷舍代码：${dormCode}
- 舍友列表：${memberNames.join("、")}
- 当前值日人：${todayDutyUser}
- 舍友人数：${memberCount}
- 当前说话人（用户）：${userName}

你可以执行以下操作类型：

1. update_status — 更新舍友状态
   格式：{ "type": "update_status", "user": "舍友昵称", "status": "状态文字" }
   常见状态：明早早八、晚归、已睡、勿扰、请假 等

2. change_duty — 更换值日人
   格式：{ "type": "change_duty", "date": "日期(如今天/明天/后天)", "from": "原值日人(可选)", "to": "新值日人" }

3. add_makeup_task — 新增补扫任务
   格式：{ "type": "add_makeup_task", "date": "日期", "user": "补扫人" }

4. update_utility — 更新水电费总额
   格式：{ "type": "update_utility", "total": 总金额数字, "memberCount": 舍友人数 }

5. add_expense — 新增费用记录，舍友平摊
   格式：{ "type": "add_expense", "title": "费用标题", "amount": 总金额, "creator": "付款人", "splitMethod": "人均", "perPerson": 人均金额, "note": "备注" }
   用途：用户说花了XX元充电费/买日用品等，自动记账并计算人均金额（金额÷舍友人数）

6. add_ai_log — 记录本次AI交互（每次回复都必须包含此操作）
   格式：{ "type": "add_ai_log", "input": "用户原始输入", "reply": "你的回复文字" }

你必须返回以下JSON格式，不要返回任何其他内容：
{
  "reply": "对用户的简短回复，用中文，列出做了哪些更新",
  "actions": [ ... 操作数组 ... ]
}

重要规则：
- user 字段使用舍友昵称（来自舍友列表），不要使用 id
- 当前说话人是 "${userName}"，除非用户明确提到其他舍友名字，否则操作对象默认是说话人
- 如果用户提到金额，自动计算人均金额（总金额 ÷ ${memberCount}），四舍五入取整
- 如果用户提到的舍友名不在列表中，忽略该操作
- reply 要简洁，直接列出更新内容，用编号格式如 "1. xxx 2. xxx"
- 只返回JSON，不要返回markdown、解释文字或其他内容`;
}

async function callDeepSeek(
  userName: string,
  dormCode: string,
  memberNames: string[],
  todayDutyUser: string,
  memberCount: number,
  userMessage: string
): Promise<AiResponse | null> {
  if (!DEEPSEEK_API_KEY) return null;

  const systemPrompt = buildSystemPrompt(userName, dormCode, memberNames, todayDutyUser, memberCount);

  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.reply || !Array.isArray(parsed.actions)) return null;

    return { reply: parsed.reply, actions: parsed.actions };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { dormCode, userName, message } = await request.json();

  const state = loadServerDormState(dormCode);

  // Try DeepSeek first, fall back to mock AI
  const result =
    await callDeepSeek(
      userName,
      dormCode,
      state.members.map((m) => m.name),
      state.todayDuty.user,
      state.members.length,
      message
    ) ?? processAiMessage(userName, message, state);

  const newState = applyAiActions(state, result.actions);
  saveServerDormState(newState);

  return NextResponse.json({ state: newState, reply: result.reply, actions: result.actions });
}