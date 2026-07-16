import type { DormState, AiAction, ExpenseRecord, ExpenseShare } from "@/data/types";
import { formatMonthDay, toDateISO } from "@/lib/dateUtils";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDateTime() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function findExpenseIndex(state: DormState, expenseId?: string, title?: string) {
  if (expenseId) {
    const byId = state.expenses.findIndex((expense) => expense.id === expenseId);
    if (byId !== -1) return byId;
  }

  const cleanTitle = title?.trim();
  if (!cleanTitle) return -1;
  return state.expenses.findIndex((expense) => expense.title.includes(cleanTitle) || cleanTitle.includes(expense.title));
}

export function applyAiActions(state: DormState, actions: AiAction[]): DormState {
  const newState = {
    ...state,
    members: [...state.members],
    aiLogs: [...state.aiLogs],
    expenses: [...state.expenses],
    announcements: [...state.announcements],
    balcony: {
      ...state.balcony,
      slots: [...state.balcony.slots],
    },
    todayDuty: { ...state.todayDuty },
    utility: { ...state.utility },
    monthlyStats: { ...state.monthlyStats },
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
        newState.todayDuty = {
          ...newState.todayDuty,
          status: "已请假",
          note: `${action.user}${action.date}补扫`,
        };
        newState.monthlyStats = {
          ...newState.monthlyStats,
          makeupCount: newState.monthlyStats.makeupCount + 1,
        };
        break;
      }
      case "complete_duty": {
        if (newState.todayDuty.user === action.user) {
          newState.todayDuty = {
            ...newState.todayDuty,
            status: "已完成",
          };
        }
        break;
      }
      case "update_utility": {
        const memberCount = Math.max(action.memberCount || newState.members.length, 1);
        newState.utility = {
          ...newState.utility,
          total: action.total,
          memberCount,
          perPerson: roundMoney(action.total / memberCount),
        };
        newState.monthlyStats = {
          ...newState.monthlyStats,
          utilityTotal: action.total,
        };
        break;
      }
      case "add_expense": {
        const memberCount = Math.max(newState.members.length, 1);
        const isCreatorOnly = action.splitMethod === "creatorOnly" || action.splitMethod === "个人支付";
        const isRatio = action.splitMethod === "ratio" || action.splitMethod.includes("比例");
        const amount = roundMoney(action.amount);
        const ratioShares: ExpenseShare[] = isRatio
          ? (action.splitShares || [])
              .filter((share) => newState.members.some((member) => member.name === share.member))
              .map((share) => ({
                member: share.member,
                ratio: roundMoney(share.ratio),
                amount: roundMoney(amount * (share.ratio / 100)),
              }))
              .filter((share) => share.ratio > 0)
          : [];
        const ratioTotal = roundMoney(ratioShares.reduce((sum, share) => sum + share.ratio, 0));
        if (isRatio && (ratioShares.length === 0 || ratioTotal > 100)) {
          break;
        }
        const newExpense: ExpenseRecord = {
          id: `exp-${Date.now()}`,
          title: action.title,
          amount,
          creator: action.creator,
          splitMethod: isCreatorOnly ? "个人支付" : isRatio ? `按比例收费（${ratioTotal}%）` : `${memberCount}人平摊`,
          perPerson: isCreatorOnly ? amount : isRatio ? 0 : roundMoney(amount / memberCount),
          splitShares: isRatio ? ratioShares : undefined,
          note: action.note || "无备注",
          date: formatMonthDay(),
          dateISO: toDateISO(),
          confirmations: newState.members.map((m) => ({
            member: m.name,
            confirmed: isCreatorOnly || m.name === action.creator || (isRatio && !ratioShares.some((share) => share.member === m.name)),
            status: isCreatorOnly || m.name === action.creator || (isRatio && !ratioShares.some((share) => share.member === m.name))
              ? "confirmed"
              : "unpaid",
          })),
        };
        newState.expenses = [newExpense, ...newState.expenses];
        newState.utility = {
          ...newState.utility,
          total: roundMoney(newState.utility.total + amount),
          perPerson: roundMoney((newState.utility.total + amount) / memberCount),
        };
        newState.monthlyStats = {
          ...newState.monthlyStats,
          utilityTotal: roundMoney(newState.monthlyStats.utilityTotal + amount),
        };
        break;
      }
      case "confirm_expense": {
        const expenseIndex = findExpenseIndex(newState, action.expenseId, action.title);
        if (expenseIndex !== -1) {
          const expense = newState.expenses[expenseIndex];
          newState.expenses[expenseIndex] = {
            ...expense,
            confirmations: expense.confirmations.map((confirmation) =>
              confirmation.member === action.user ? { ...confirmation, confirmed: true, status: "confirmed" } : confirmation
            ),
          };
        }
        break;
      }
      case "delete_expense": {
        const member = newState.members.find((m) => m.name === action.user);
        const expenseIndex = findExpenseIndex(newState, action.expenseId, action.title);
        if (member?.role === "leader" && expenseIndex !== -1) {
          const expense = newState.expenses[expenseIndex];
          const memberCount = Math.max(newState.members.length, 1);
          newState.expenses = newState.expenses.filter((_, index) => index !== expenseIndex);
          newState.utility = {
            ...newState.utility,
            total: Math.max(0, roundMoney(newState.utility.total - expense.amount)),
            perPerson: Math.max(0, roundMoney((newState.utility.total - expense.amount) / memberCount)),
          };
          newState.monthlyStats = {
            ...newState.monthlyStats,
            utilityTotal: Math.max(0, roundMoney(newState.monthlyStats.utilityTotal - expense.amount)),
          };
        }
        break;
      }
      case "add_announcement": {
        const announcement = {
          id: `ann-${Date.now()}`,
          title: action.title,
          content: action.content,
          author: action.author,
          date: formatDateTime(),
          pinned: action.pinned ?? true,
          readCount: 1,
          totalMembers: newState.members.length,
          readByMe: true,
        };
        newState.announcements = [
          announcement,
          ...newState.announcements.map((item) => ({
            ...item,
            pinned: action.pinned ?? true ? false : item.pinned,
          })),
        ];
        break;
      }
      case "mark_announcement_read": {
        const cleanTitle = action.title?.trim();
        const index = newState.announcements.findIndex((announcement) =>
          action.announcementId
            ? announcement.id === action.announcementId
            : cleanTitle
              ? announcement.title.includes(cleanTitle) || cleanTitle.includes(announcement.title)
              : announcement.pinned
        );
        if (index !== -1) {
          const announcement = newState.announcements[index];
          newState.announcements[index] = {
            ...announcement,
            readByMe: true,
            readCount: announcement.readByMe ? announcement.readCount : announcement.readCount + 1,
          };
        }
        break;
      }
      case "add_laundry_slot": {
        if (newState.balcony.slots.length < newState.balcony.totalSlots) {
          newState.balcony = {
            ...newState.balcony,
            slots: [
              ...newState.balcony.slots,
              {
                user: action.user,
                type: action.itemType,
                collectTime: action.collectTime,
                status: "晾晒中",
              },
            ],
          };
        }
        break;
      }
      case "collect_laundry": {
        const targetIndex =
          typeof action.slotIndex === "number"
            ? action.slotIndex
            : newState.balcony.slots.findIndex((slot) => slot.user === action.user);
        if (targetIndex >= 0 && newState.balcony.slots[targetIndex]?.user === action.user) {
          newState.balcony = {
            ...newState.balcony,
            slots: newState.balcony.slots.filter((_, index) => index !== targetIndex),
          };
        }
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
