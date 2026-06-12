import type { AiResponse, AiAction, DormState } from "./types";

export function processAiMessage(
  userName: string,
  message: string,
  state: DormState
): AiResponse {
  const actions: AiAction[] = [];
  const lines: string[] = [];

  if (message.includes("早八")) {
    actions.push({ type: "update_status", user: userName, status: "明早早八" });
    lines.push(`你已设置为"明早早八"。`);
  }

  if (message.includes("晚归")) {
    actions.push({ type: "update_status", user: userName, status: "晚归" });
    lines.push(`你已设置为"晚归"。`);
  }

  if (message.includes("已睡") || message.includes("睡觉") || message.includes("睡了")) {
    actions.push({ type: "update_status", user: userName, status: "已睡" });
    lines.push(`你已设置为"已睡"。`);
  }

  if (message.includes("勿扰") || message.includes("安静")) {
    actions.push({ type: "update_status", user: userName, status: "勿扰" });
    lines.push(`你已设置为"勿扰"。`);
  }

  if (message.includes("换值日") || message.includes("换班") || message.includes("换扫")) {
    const memberNames = state.members.map((m) => m.name);
    const target = memberNames.find((n) => message.includes(n) && n !== userName);
    if (target) {
      actions.push({ type: "change_duty", date: "明天", from: userName, to: target });
      lines.push(`明天值日已调整为${target}代扫。`);
    }
  }

  if (message.includes("请假") || message.includes("不在")) {
    actions.push({ type: "update_status", user: userName, status: "请假" });
    const memberNames = state.members.map((m) => m.name);
    const target = memberNames.find((n) => message.includes(n) && n !== userName);
    if (target) {
      actions.push({ type: "change_duty", date: "明天", from: userName, to: target });
      lines.push(`明天值日已调整为${target}代扫。`);
    } else {
      lines.push(`你已标记请假。`);
    }
  }

  if (message.includes("代扫") || message.includes("帮我扫") || message.includes("帮我值日")) {
    const memberNames = state.members.map((m) => m.name);
    const target = memberNames.find((n) => message.includes(n) && n !== userName);
    if (target) {
      actions.push({ type: "change_duty", date: "明天", from: userName, to: target });
      lines.push(`${target}已为你代扫明天值日。`);
    }
  }

  if (message.includes("补扫") || message.includes("补值日")) {
    actions.push({ type: "add_makeup_task", date: "后天", user: userName });
    lines.push(`后天已为你新增一次补扫任务。`);
  }

  if (message.includes("水电") || message.includes("电费") || message.includes("水费")) {
    const numMatch = message.match(/(\d+)/);
    if (numMatch) {
      const total = parseInt(numMatch[1], 10);
      actions.push({ type: "update_utility", total, memberCount: state.members.length });
      lines.push(`水电费已更新为${total}元，人均${Math.round(total / state.members.length)}元。`);
    }
  }

  if (message.includes("洗晒") || message.includes("洗衣服") || message.includes("晾晒")) {
    if (state.laundry.suitable) {
      lines.push(`今天适合洗晒！洗晒指数${state.laundry.index}，预计晾晒${state.laundry.dryingHours}。`);
    } else {
      lines.push(`今天不太适合洗晒，建议改天再洗。`);
    }
  }

  if (lines.length === 0) {
    lines.push("已收到你的消息，我会帮你处理宿舍事务。");
  }

  const reply = "已更新宿舍状态：\n" + lines.map((l, i) => `${i + 1}. ${l}`).join("\n");

  actions.push({ type: "add_ai_log", input: message, reply });

  return { reply, actions };
}