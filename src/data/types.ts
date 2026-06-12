export type DormMember = {
  id: string;
  name: string;
  role: "member" | "leader";
  status: string;
  avatarInitial: string;
};

export type DutyState = {
  date: string;
  dateLabel: string;
  user: string;
  area: string;
  suggestion: string;
  status: "未完成" | "已完成" | "已换班" | "代扫中" | "已请假";
  note?: string;
};

export type DutyScheduleDay = {
  date: string;
  dayLabel: string;
  shortDate: string;
  itemCount: number;
  statusLabel: string;
  isToday: boolean;
};

export type UtilityState = {
  month: string;
  total: number;
  memberCount: number;
  perPerson: number;
  confirmedCount: number;
};

export type LaundryState = {
  date: string;
  weather: string;
  weatherIcon: string;
  temperature: string;
  index: number;
  suitable: boolean;
  suggestion: string;
  dryingHours: string;
};

export type BalconySlot = {
  user: string;
  type: string;
  collectTime: string;
  status: string;
};

export type BalconyState = {
  totalSlots: number;
  slots: BalconySlot[];
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  pinned: boolean;
  readCount: number;
  totalMembers: number;
  readByMe: boolean;
};

export type ExpenseConfirmation = {
  member: string;
  confirmed: boolean;
};

export type ExpenseRecord = {
  id: string;
  title: string;
  amount: number;
  creator: string;
  splitMethod: string;
  perPerson: number;
  note: string;
  date: string;
  confirmations: ExpenseConfirmation[];
};

export type AiLog = {
  time: string;
  input: string;
  reply: string;
};

export type MonthlyStats = {
  dutyCompletionRate: number;
  changeCount: number;
  substituteCount: number;
  makeupCount: number;
  utilityTotal: number;
  laundryGoodDays: number;
  lateReturnCount: number;
  earlyClassCount: number;
  weeklyExpenses: WeeklyExpense[];
  expenseBreakdown: ExpenseBreakdown[];
};

export type WeeklyExpense = {
  week: string;
  amount: number;
};

export type ExpenseBreakdown = {
  category: string;
  amount: number;
};

export type DormState = {
  dormCode: string;
  members: DormMember[];
  todayDuty: DutyState;
  dutySchedule: DutyScheduleDay[];
  utility: UtilityState;
  laundry: LaundryState;
  balcony: BalconyState;
  announcements: Announcement[];
  expenses: ExpenseRecord[];
  aiLogs: AiLog[];
  monthlyStats: MonthlyStats;
};

export type AiAction =
  | { type: "update_status"; user: string; status: string }
  | { type: "change_duty"; date: string; from?: string; to: string }
  | { type: "add_makeup_task"; date: string; user: string }
  | { type: "complete_duty"; user: string }
  | { type: "update_utility"; total: number; memberCount: number }
  | { type: "add_expense"; title: string; amount: number; creator: string; splitMethod: string; perPerson: number; note: string }
  | { type: "confirm_expense"; expenseId?: string; title?: string; user: string }
  | { type: "delete_expense"; expenseId?: string; title?: string; user: string }
  | { type: "add_announcement"; title: string; content: string; author: string; pinned?: boolean }
  | { type: "mark_announcement_read"; announcementId?: string; title?: string }
  | { type: "add_laundry_slot"; user: string; itemType: string; collectTime: string }
  | { type: "collect_laundry"; user: string; slotIndex?: number }
  | { type: "add_ai_log"; input: string; reply: string };

export type AiResponse = {
  reply: string;
  actions: AiAction[];
};

export type UserSession = {
  nickname: string;
  dormCode: string;
  role: "member" | "leader";
};

export type LaundryForecastDay = {
  label: string;
  date: string;
  icon: string;
  selected: boolean;
};
