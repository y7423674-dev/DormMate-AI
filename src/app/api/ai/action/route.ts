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

5. add_expense — 新增费用记录
   平摊格式：{ "type": "add_expense", "title": "费用标题", "amount": 总金额, "creator": "付款人", "splitMethod": "人均", "perPerson": 人均金额, "note": "备注" }
   个人支付格式：{ "type": "add_expense", "title": "费用标题", "amount": 总金额, "creator": "付款人", "splitMethod": "creatorOnly", "perPerson": 总金额, "note": "备注" }
   按比例格式：{ "type": "add_expense", "title": "费用标题", "amount": 总金额, "creator": "付款人", "splitMethod": "ratio", "perPerson": 总金额, "splitShares": [{ "member": "舍友昵称", "ratio": 比例数字, "amount": 0 }], "note": "备注" }
   用途：用户说花了XX元充电费/买日用品等，自动记账。没有明确分摊方式时，一律按舍友平摊；只有用户明确说“仅我支付/我自己付/个人花费/不用平摊/不AA”等，才使用 creatorOnly；只有用户明确说“按比例/比例分摊/百分比”并给出各成员比例时，才使用 ratio。

6. complete_duty — 标记当前值日完成
   格式：{ "type": "complete_duty", "user": "完成值日的舍友昵称" }

7. confirm_expense — 标记用户已确认/已完成缴费
   格式：{ "type": "confirm_expense", "title": "费用标题(可选)", "user": "确认人" }
   用途：用户说我已缴费/我确认电费/水电已付等。没有具体标题时确认最近一条相关费用。

8. delete_expense — 删除费用记录（仅舍长会生效）
   格式：{ "type": "delete_expense", "title": "费用标题", "user": "发起删除的人" }

9. add_announcement — 发布公告
   格式：{ "type": "add_announcement", "title": "公告标题", "content": "公告内容", "author": "发布人", "pinned": true }

10. mark_announcement_read — 标记公告已读
   格式：{ "type": "mark_announcement_read", "title": "公告标题(可选)" }

11. add_laundry_slot — 登记晾晒
   格式：{ "type": "add_laundry_slot", "user": "晾晒人", "itemType": "衣物类型", "collectTime": "收衣时间，如22:00" }

12. collect_laundry — 确认收衣，释放阳台位置
   格式：{ "type": "collect_laundry", "user": "收衣人" }

13. add_ai_log — 记录本次AI交互（每次回复都必须包含此操作）
   格式：{ "type": "add_ai_log", "input": "用户原始输入", "reply": "你的回复文字" }

你必须返回以下JSON格式，不要返回任何其他内容：
{
  "reply": "对用户的简短回复，用中文，列出做了哪些更新",
  "actions": [ ... 操作数组 ... ]
}

重要规则：
- user 字段使用舍友昵称（来自舍友列表），不要使用 id
- 当前说话人是 "${userName}"，除非用户明确提到其他舍友名字，否则操作对象默认是说话人
- 如果用户提到金额，默认新增平摊支出，自动计算人均金额（总金额 ÷ ${memberCount}），四舍五入取整
- 只有用户明确表达“仅我支付、只我支付、我自己支付、我自己付、个人花费、个人支付、不用平摊、不平摊、不AA、不用AA”时，add_expense 的 splitMethod 才能使用 "creatorOnly"，perPerson 等于总金额
- 只有用户明确表达“按比例、比例分摊、比例收费、百分比、%”并给出成员比例时，add_expense 的 splitMethod 才能使用 "ratio"；splitShares 只包含有比例的成员，ratio 总和必须不超过100，amount 填 0 即可，由系统计算
- 除了明确提及个人支付或按比例收费，所有 AI 记录开支都统一使用平摊方式
- 如果用户说“发公告/通知大家/提醒大家”，使用 add_announcement；标题可以从内容中提炼，内容保留用户原意
- 如果用户说“我要晾晒/晒衣服/晾床单”，使用 add_laundry_slot；未给收衣时间时默认 22:00，未给衣物类型时默认“轻薄衣物”
- 如果用户说“收衣/衣服收了”，使用 collect_laundry
- 如果用户说“我已完成值日/扫完了”，使用 complete_duty
- 如果用户说“已缴费/已确认/我付了”，使用 confirm_expense
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
