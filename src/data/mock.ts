import type { DormState, LaundryForecastDay } from "./types";

export const defaultDormCode = "DORM-402";

export const laundryForecastDays: LaundryForecastDay[] = [
  { label: "今天", date: "5/31", icon: "sun", selected: true },
  { label: "明天", date: "6/1", icon: "cloudSun", selected: false },
  { label: "周三", date: "6/2", icon: "rain", selected: false },
  { label: "周四", date: "6/3", icon: "sun", selected: false },
];

export function createDefaultDormState(dormCode: string): DormState {
  return {
    dormCode,
    members: [
      { id: "1", name: "小李", role: "leader", status: "熟睡", avatarInitial: "李" },
      { id: "2", name: "小王", role: "member", status: "晚归", avatarInitial: "王" },
      { id: "3", name: "小陈", role: "member", status: "勿扰", avatarInitial: "陈" },
      { id: "4", name: "小林", role: "member", status: "晚起", avatarInitial: "林" },
    ],
    todayDuty: {
      date: "2026-05-31",
      dateLabel: "05月31日 周日",
      user: "小李",
      area: "公共地面",
      suggestion: "22:00前完成",
      status: "未完成",
    },
    dutySchedule: [
      { date: "2026-05-30", dayLabel: "周六", shortDate: "05/30", itemCount: 1, statusLabel: "已完成", isToday: false },
      { date: "2026-05-31", dayLabel: "今天", shortDate: "05/31", itemCount: 1, statusLabel: "待完成", isToday: true },
      { date: "2026-06-01", dayLabel: "周一", shortDate: "06/01", itemCount: 0, statusLabel: "待完成", isToday: false },
    ],
    utility: {
      month: "2026-06",
      total: 128,
      memberCount: 4,
      perPerson: 32,
      confirmedCount: 3,
    },
    laundry: {
      date: "2026-05-31",
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
        date: "6月1日",
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
        date: "6月3日",
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
