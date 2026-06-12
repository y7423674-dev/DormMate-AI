import type { AiResponse, AiAction, DormState } from "./types";

function findMentionedMember(message: string, state: DormState, fallback: string) {
  return state.members.find((member) => message.includes(member.name))?.name || fallback;
}

function findOtherMentionedMember(message: string, state: DormState, userName: string) {
  return state.members.find((member) => member.name !== userName && message.includes(member.name))?.name;
}

function extractAmount(message: string) {
  const match = message.match(/(\d+(?:\.\d+)?)\s*(?:元|块|块钱)?/);
  return match ? Number(match[1]) : null;
}

function extractTime(message: string) {
  const clock = message.match(/([01]?\d|2[0-3])[:：点时]([0-5]\d)?/);
  if (!clock) return "22:00";
  const hour = clock[1].padStart(2, "0");
  const minute = clock[2] || "00";
  return `${hour}:${minute}`;
}

function inferExpenseTitle(message: string) {
  if (message.includes("水电")) return "水电费";
  if (message.includes("电费")) return "电费";
  if (message.includes("水费")) return "水费";
  if (message.includes("公共用品") || message.includes("日用品")) return "公共用品";
  if (message.includes("网费")) return "网费";
  if (message.includes("垃圾袋")) return "垃圾袋";
  return "宿舍支出";
}

function inferLaundryType(message: string) {
  if (message.includes("床单")) return "床单";
  if (message.includes("被套")) return "被套";
  if (message.includes("外套")) return "厚外套";
  if (message.includes("鞋")) return "鞋子";
  return "轻薄衣物";
}

function buildAnnouncement(message: string) {
  const cleaned = message
    .replace(/^(帮我|请|麻烦)?(发|发布|新增)?(一条)?(公告|通知|提醒)(大家|一下)?[：:，,\s]*/u, "")
    .trim();
  const content = cleaned || message.trim();
  const title = content.length > 14 ? `${content.slice(0, 14)}...` : content;
  return { title: title || "宿舍通知", content: content || "请大家留意宿舍通知。" };
}

function findExpenseTitle(message: string, state: DormState) {
  return state.expenses.find((expense) => message.includes(expense.title))?.title;
}

export function processAiMessage(
  userName: string,
  message: string,
  state: DormState
): AiResponse {
  const actions: AiAction[] = [];
  const lines: string[] = [];
  const normalized = message.trim();

  if (normalized.includes("早八")) {
    actions.push({ type: "update_status", user: userName, status: "明早早八" });
    lines.push("已把你的状态设为明早早八。");
  }

  if (normalized.includes("晚归")) {
    actions.push({ type: "update_status", user: userName, status: "晚归" });
    lines.push("已把你的状态设为晚归。");
  }

  if (/(已睡|睡觉|睡了|休息)/u.test(normalized)) {
    actions.push({ type: "update_status", user: userName, status: "已睡" });
    lines.push("已把你的状态设为已睡。");
  }

  if (/(勿扰|安静|别打扰)/u.test(normalized)) {
    actions.push({ type: "update_status", user: userName, status: "勿扰" });
    lines.push("已把你的状态设为勿扰。");
  }

  if (/(请假|不在|外出)/u.test(normalized)) {
    actions.push({ type: "update_status", user: userName, status: "请假" });
    lines.push("已把你的状态设为请假。");
  }

  if (/(完成值日|值日完成|扫完|打扫完|已完成)/u.test(normalized)) {
    actions.push({ type: "complete_duty", user: userName });
    lines.push("已标记你的今日值日为完成。");
  }

  if (/(换值日|换班|换扫|代扫|帮我扫|帮我值日)/u.test(normalized)) {
    const target = findOtherMentionedMember(normalized, state, userName);
    if (target) {
      actions.push({ type: "change_duty", date: "明天", from: userName, to: target });
      lines.push(`已把明天值日调整为${target}代扫。`);
    }
  }

  if (/(补扫|补值日)/u.test(normalized)) {
    actions.push({ type: "add_makeup_task", date: "后天", user: userName });
    lines.push("已为你新增后天补扫任务。");
  }

  const amount = extractAmount(normalized);
  const isExpenseIntent = /(花了|买了|支出|记账|缴费|水电|电费|水费|网费|公共用品|日用品|垃圾袋)/u.test(normalized);
  if (amount && isExpenseIntent) {
    const title = inferExpenseTitle(normalized);
    const creator = findMentionedMember(normalized, state, userName);
    const memberCount = Math.max(state.members.length, 1);
    const perPerson = Math.round((amount / memberCount) * 100) / 100;

    actions.push({
      type: "add_expense",
      title,
      amount,
      creator,
      splitMethod: `${memberCount}人平摊`,
      perPerson,
      note: normalized,
    });
    lines.push(`已新增${title} ${amount}元，人均${perPerson}元。`);
  } else if (amount && /(水电|电费|水费)/u.test(normalized)) {
    actions.push({ type: "update_utility", total: amount, memberCount: state.members.length });
    lines.push(`已把水电费总额更新为${amount}元。`);
  }

  if (/(已缴费|已付|付了|已确认|确认缴费|完成缴费)/u.test(normalized)) {
    const title = findExpenseTitle(normalized, state);
    actions.push({ type: "confirm_expense", title, user: userName });
    lines.push(title ? `已确认你的${title}缴费。` : "已确认你最近一条缴费。");
  }

  if (/(删除|移除|删掉)/u.test(normalized) && /(费用|缴费|支出|记录)/u.test(normalized)) {
    const title = findExpenseTitle(normalized, state) || inferExpenseTitle(normalized);
    actions.push({ type: "delete_expense", title, user: userName });
    lines.push(`已尝试删除${title}记录；只有舍长操作会生效。`);
  }

  if (/(发公告|发布公告|新增公告|通知大家|提醒大家)/u.test(normalized)) {
    const announcement = buildAnnouncement(normalized);
    actions.push({
      type: "add_announcement",
      title: announcement.title,
      content: announcement.content,
      author: userName,
      pinned: true,
    });
    lines.push(`已发布公告：${announcement.title}`);
  }

  if (/(已读|看过公告|读了公告)/u.test(normalized)) {
    actions.push({ type: "mark_announcement_read", title: undefined });
    lines.push("已把置顶公告标记为已读。");
  }

  if (/(我要晾晒|帮我晾|晾衣|晒衣|晾晒|晒床单)/u.test(normalized)) {
    const itemType = inferLaundryType(normalized);
    const collectTime = extractTime(normalized);
    actions.push({ type: "add_laundry_slot", user: userName, itemType, collectTime });
    lines.push(`已登记${itemType}晾晒，预计${collectTime}收衣。`);
  } else if (/(洗晒|洗衣服|适合洗)/u.test(normalized)) {
    lines.push(
      state.laundry.suitable
        ? `今天适合洗晒，洗晒指数${state.laundry.index}，预计晾晒${state.laundry.dryingHours}。`
        : "今天不太适合洗晒，建议改天再洗。"
    );
  }

  if (/(收衣|衣服收了|取衣|收走)/u.test(normalized)) {
    actions.push({ type: "collect_laundry", user: userName });
    lines.push("已确认收衣并释放阳台位置。");
  }

  if (lines.length === 0) {
    lines.push("我还没有识别到可执行的宿舍操作，可以试试：发公告、登记晾晒、确认缴费、完成值日或更新状态。");
  }

  const reply = lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
  actions.push({ type: "add_ai_log", input: message, reply });

  return { reply, actions };
}
