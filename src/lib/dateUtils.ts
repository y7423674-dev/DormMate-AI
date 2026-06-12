const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateISO(date = new Date()) {
  const local = startOfLocalDay(date);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthDay(date = new Date()) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatShortDate(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDateLabel(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日 ${WEEKDAYS[date.getDay()]}`;
}

export function formatWeekday(date = new Date()) {
  return WEEKDAYS[date.getDay()];
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function compareDateISO(left: string, right: string) {
  return left.localeCompare(right);
}
