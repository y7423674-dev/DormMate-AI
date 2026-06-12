import type { DormState, AiAction, ExpenseRecord } from "@/data/types";

export function applyAiActions(state: DormState, actions: AiAction[]): DormState {
  const newState = {
    ...state,
    members: [...state.members],
    aiLogs: [...state.aiLogs],
    expenses: [...state.expenses],
  };

  for (const action of actions) {
    switch (action.type) {
      case "update_status": {
        const idx = newState.members.findIndex((m) => m.name === action.user);
        if (idx !== -1) {
          newState.members[idx] = { ...newState.members[idx], status: action.status };
        }
        break;
      }
      case "change_duty": {
        newState.todayDuty = {
          ...newState.todayDuty,
          user: action.to,
          status: "代扫中",
        };
        break;
      }
      case "add_makeup_task": {
        newState.todayDuty = { ...newState.todayDuty };
        break;
      }
      case "update_utility": {
        newState.utility = {
          ...newState.utility,
          total: action.total,
          memberCount: action.memberCount,
          perPerson: Math.round(action.total / action.memberCount),
        };
        break;
      }
      case "add_expense": {
        const newExpense: ExpenseRecord = {
          id: `exp-${Date.now()}`,
          title: action.title,
          amount: action.amount,
          creator: action.creator,
          splitMethod: action.splitMethod,
          perPerson: action.perPerson,
          note: action.note,
          date: new Date().toLocaleDateString("zh-CN"),
          confirmations: newState.members.map((m) => ({
            member: m.name,
            confirmed: m.name === action.creator,
          })),
        };
        newState.expenses.push(newExpense);
        break;
      }
      case "add_ai_log": {
        newState.aiLogs.push({
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          input: action.input,
          reply: action.reply,
        });
        break;
      }
    }
  }

  return newState;
}