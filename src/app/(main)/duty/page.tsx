"use client";

import Link from "next/link";
import { useState } from "react";
import { useDorm } from "@/app/DormProvider";
import AppIcon from "@/components/AppIcon";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";
import { addDays, formatDateLabel, formatShortDate, formatWeekday, toDateISO } from "@/lib/dateUtils";

function positiveModulo(value: number, modulo: number) {
  return ((value % modulo) + modulo) % modulo;
}

export default function DutyPage() {
  const { state, session, apiPost } = useDorm();
  const [selectedOffset, setSelectedOffset] = useState(0);
  if (!state || !session) return null;

  const duty = state.todayDuty;
  const myName = session.nickname;
  const today = new Date();
  const todayIndex = Math.max(state.members.findIndex((member) => member.name === duty.user), 0);
  const selectedDate = addDays(today, selectedOffset);
  const selectedUser = state.members[positiveModulo(todayIndex + selectedOffset, state.members.length)]?.name || duty.user;
  const selectedStatus =
    selectedOffset < 0
      ? "已完成"
      : selectedOffset > 0
        ? "待完成"
        : duty.status;
  const isMyDuty = selectedOffset === 0 && selectedUser === myName;
  const isDutyDone = duty.status === "已完成";
  const schedule = [-1, 0, 1].map((offset) => {
    const date = addDays(today, offset);
    const user = state.members[positiveModulo(todayIndex + offset, state.members.length)]?.name || duty.user;
    const statusLabel =
      offset < 0
        ? "已完成"
        : offset > 0
          ? "待完成"
          : user === myName
            ? isDutyDone ? "已完成" : "待完成"
            : "无需值扫";
    return {
      date: toDateISO(date),
      offset,
      dayLabel: offset === -1 ? "昨天" : offset === 0 ? "今天" : "明天",
      shortDate: formatShortDate(date),
      itemCount: 1,
      statusLabel,
      user,
      isToday: offset === 0,
    };
  });

  function handleComplete() {
    apiPost("duty/complete", { userName: myName });
  }

  return (
    <div>
      <PageHeader title="值扫" />

      {/* 3-day Date Slider */}
      <CardShell variant="sage" title="">
        <p className="text-sm text-muted-olive text-center mb-3">
          {formatDateLabel(addDays(today, -1))} - {formatDateLabel(addDays(today, 1))}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {schedule.map((day) => (
            <button
              type="button"
              key={day.date}
              onClick={() => setSelectedOffset(day.offset)}
              className={`rounded-[20px] p-3 text-center transition-colors ${
                selectedOffset === day.offset
                  ? "bg-white/80 border border-[#A7D86D] shadow-[0_10px_22px_rgba(82,94,72,0.1)]"
                  : "bg-white/45"
              }`}
            >
              <p className="text-sm font-bold text-deep-olive">{day.dayLabel}</p>
              <p className="text-xs text-muted-olive">{day.shortDate}</p>
              <p className="text-xs text-muted-olive">{day.user}</p>
              <p className="text-xs text-muted-olive">{day.itemCount}项</p>
              <StatusBadge
                label={day.statusLabel}
                variant={day.statusLabel === "已完成" ? "success" : "warning"}
              />
            </button>
          ))}
        </div>
      </CardShell>

      {/* Selected Duty Card */}
      {isMyDuty && !isDutyDone ? (
        <CardShell title="">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-base font-bold text-deep-olive">
              <span className="icon-badge-sm">
                <AppIcon name="broom" className="h-[18px] w-[18px]" />
              </span>
              {formatWeekday(selectedDate)}值日
            </span>
            <StatusBadge label={duty.status} variant="warning" />
          </div>
          <p className="text-sm text-muted-olive">日期：{formatDateLabel(selectedDate)}</p>
          <p className="text-sm text-deep-olive">负责人：<strong>{selectedUser}</strong></p>
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
            <p className="mt-2 text-sm font-bold text-deep-olive">{formatDateLabel(selectedDate)}</p>
            <p className="text-sm text-muted-olive mt-2">
              {selectedOffset === 0
                ? isMyDuty
                  ? "今日值日已完成"
                  : "今日无你的值日任务"
                : selectedOffset < 0
                  ? "前一天值扫记录"
                  : "后一天值扫安排"}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-olive">负责人：{selectedUser}</p>
            <p className="mt-1 text-xs font-medium text-muted-olive">区域：{duty.area}</p>
            <div className="mt-2 flex justify-center">
              <StatusBadge label={selectedStatus} variant={selectedStatus === "已完成" ? "success" : "warning"} />
            </div>
          </div>
        </CardShell>
      )}
    </div>
  );
}
