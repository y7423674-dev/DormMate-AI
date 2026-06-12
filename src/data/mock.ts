import type { DormState, LaundryForecastDay } from "./types";
import { addDays, formatDateLabel, formatMonthDay, formatShortDate, toDateISO } from "@/lib/dateUtils";

export const defaultDormCode = "DORM-402";

export const laundryForecastDays: LaundryForecastDay[] = [
  { label: "今天", date: "5/31", icon: "sun", selected: true },
  { label: "明天", date: "6/1", icon: "cloudSun", selected: false },
  { label: "周三", date: "6/2", icon: "rain", selected: false },
  { label: "周四", date: "6/3", icon: "sun", selected: false },
];

export function createDefaultDormState(dormCode: string): DormState {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const firstExpenseDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const secondExpenseDate = new Date(today.getFullYear(), today.getMonth(), Math.min(3, today.getDate()));

  return {
    dormCode,
    members: [
      { id: "1", name: "小李", role: "member", status: "熟睡", avatarInitial: "李" },
      { id: "2", name: "小王", role: "member", status: "晚归", avatarInitial: "王" },
      { id: "3", name: "小陈", role: "member", status: "勿扰", avatarInitial: "陈" },
      { id: "4", name: "小林", role: "member", status: "晚起", avatarInitial: "林" },
    ],
    todayDuty: {
      date: toDateISO(today),
      dateLabel: formatDateLabel(today),
      user: "小李",
      area: "公共地面",
      suggestion: "22:00前完成",
      status: "未完成",
    },
    dutySchedule: [
      { date: toDateISO(yesterday), dayLabel: "昨天", shortDate: formatShortDate(yesterday), itemCount: 1, statusLabel: "已完成", isToday: false },
      { date: toDateISO(today), dayLabel: "今天", shortDate: formatShortDate(today), itemCount: 1, statusLabel: "待完成", isToday: true },
      { date: toDateISO(tomorrow), dayLabel: "明天", shortDate: formatShortDate(tomorrow), itemCount: 1, statusLabel: "待完成", isToday: false },
    ],
    utility: {
      month: currentMonth,
      total: 128,
      memberCount: 4,
      perPerson: 32,
      confirmedCount: 3,
    },
    laundry: {
      date: toDateISO(today),
      weather: "晴 / 微风",
      weatherIcon: "sun",
      temperature: "22℃ - 29℃",
      index: 85,
      suitable: true,
      suggestion: "适合洗轻薄衣物和床单，厚外套建议错峰晾晒。",
      dryingHours: "4 - 6 小时",
    },
    balcony: {
      totalSlots: 4,
      slots: [
        { user: "小李", type: "轻薄衣物", collectTime: "22:00", status: "已晾晒" },
        { user: "小王", type: "床单", collectTime: "22:30", status: "已晾晒" },
      ],
    },
    announcements: [
      {
        id: "ann-1",
        title: "周五晚宿舍大扫除",
        content: "周五晚上20:00大扫除，请大家提前整理个人物品，公共区域需要全面清扫。请各位配合！",
        author: "小李",
        date: "05/31 18:00",
        pinned: true,
        readCount: 3,
        totalMembers: 4,
        readByMe: false,
      },
    ],
    expenses: [
      {
        id: "exp-1",
        title: "电费",
        amount: 80,
        creator: "小李",
        splitMethod: "4人平摊",
        perPerson: 20,
        note: "6月宿舍电费",
        date: formatMonthDay(firstExpenseDate),
        dateISO: toDateISO(firstExpenseDate),
        confirmations: [
          { member: "小李", confirmed: true },
          { member: "小王", confirmed: true },
          { member: "小陈", confirmed: true },
          { member: "小林", confirmed: false },
        ],
      },
      {
        id: "exp-2",
        title: "公共用品",
        amount: 24,
        creator: "小王",
        splitMethod: "4人平摊",
        perPerson: 6,
        note: "洗洁精、垃圾袋",
        date: formatMonthDay(secondExpenseDate),
        dateISO: toDateISO(secondExpenseDate),
        confirmations: [
          { member: "小李", confirmed: true },
          { member: "小王", confirmed: true },
          { member: "小陈", confirmed: false },
          { member: "小林", confirmed: false },
        ],
      },
    ],
    aiLogs: [
      {
        time: "22:10",
        input: "我明天早八，今晚11点前睡，帮我把明天值日换给小王，后天我补扫。",
        reply: "已更新：你今晚23:00前睡觉，明天值日已调整为小王代扫，后天新增补扫任务。",
      },
    ],
    monthlyStats: {
      dutyCompletionRate: 0.85,
      changeCount: 3,
      substituteCount: 2,
      makeupCount: 1,
      utilityTotal: 174,
      laundryGoodDays: 18,
      lateReturnCount: 5,
      earlyClassCount: 12,
      weeklyExpenses: [
        { week: "第1周", amount: 60 },
        { week: "第2周", amount: 28 },
        { week: "第3周", amount: 72 },
        { week: "第4周", amount: 14 },
      ],
      expenseBreakdown: [
        { category: "水电费", amount: 128 },
        { category: "公共支出", amount: 46 },
      ],
    },
  };
}
