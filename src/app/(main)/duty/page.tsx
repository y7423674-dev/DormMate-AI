"use client";

import Link from "next/link";
import { useDorm } from "@/app/DormProvider";
import AppIcon from "@/components/AppIcon";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

export default function DutyPage() {
  const { state, session, apiPost } = useDorm();
  if (!state || !session) return null;

  const duty = state.todayDuty;
  const myName = session.nickname;
  const isMyDuty = duty.user === myName;
  const isDutyDone = duty.status === "已完成";
  const schedule = state.dutySchedule.map((day) => {
    if (!day.isToday) return day;
    if (!isMyDuty) return { ...day, itemCount: 0, statusLabel: "无需值扫" };
    return { ...day, itemCount: 1, statusLabel: isDutyDone ? "已完成" : "待完成" };
  });

  function handleComplete() {
    apiPost("duty/complete", { userName: myName });
  }

  return (
    <div>
      <PageHeader title="值扫" />

      {/* 3-day Date Slider */}
      <CardShell variant="sage" title="">
        <p className="text-sm text-muted-olive text-center mb-3">2026/05/30 - 2026/06/01</p>
        <div className="grid grid-cols-3 gap-2">
          {schedule.map((day) => (
            <div
              key={day.date}
              className={`text-center p-3 rounded-[20px] transition-colors ${
                day.isToday
                  ? "bg-white/80 border border-[#A7D86D] shadow-[0_10px_22px_rgba(82,94,72,0.1)]"
                  : "bg-white/45"
              }`}
            >
              <p className="text-sm font-bold text-deep-olive">{day.dayLabel}</p>
              <p className="text-xs text-muted-olive">{day.shortDate}</p>
              <p className="text-xs text-muted-olive">{day.itemCount}项</p>
              <StatusBadge
                label={day.statusLabel}
                variant={day.statusLabel === "已完成" ? "success" : "warning"}
              />
            </div>
          ))}
        </div>
      </CardShell>

      {/* Today's Duty Card */}
      {isMyDuty && !isDutyDone ? (
        <CardShell title="">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-base font-bold text-deep-olive">
              <span className="icon-badge-sm">
                <AppIcon name="broom" className="h-[18px] w-[18px]" />
              </span>
              值日
            </span>
            <StatusBadge label={duty.status} variant="warning" />
          </div>
          <p className="text-sm text-deep-olive">负责人：<strong>{duty.user}</strong></p>
          <p className="text-sm text-muted-olive">区域：{duty.area}</p>
          <p className="text-sm text-muted-olive">建议：{duty.suggestion}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleComplete} className="btn-dark text-sm">我已完成</button>
            <Link href="/duty/swap" className="btn-sage text-sm">换班</Link>
          </div>
        </CardShell>
      ) : (
        <CardShell title="">
          <div className="text-center py-4">
            <span className="icon-badge icon-badge-dark mx-auto">
              <AppIcon name="check" className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-olive mt-2">
              {isMyDuty ? "今日值日已完成" : "今日无你的值日任务"}
            </p>
            {!isMyDuty && (
              <p className="mt-1 text-xs font-medium text-muted-olive">今日负责人：{duty.user}</p>
            )}
          </div>
        </CardShell>
      )}
    </div>
  );
}
