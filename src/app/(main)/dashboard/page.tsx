"use client";

import Link from "next/link";
import { useDorm } from "@/app/DormProvider";
import AppIcon, { type AppIconName } from "@/components/AppIcon";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

function statusVariant(status: string) {
  if (status === "熟睡" || status === "在寝") return "success";
  if (status === "晚归" || status === "未完成") return "warning";
  if (status === "勿扰") return "danger";
  return "default";
}

export default function DashboardPage() {
  const { state, session, apiPost } = useDorm();
  if (!state || !session) return null;

  const ann = state.announcements.find((a) => a.pinned);
  const myName = session.nickname;

  // Dynamic task list
  const isMyDuty = state.todayDuty.user === myName;
  const dutyDone = !isMyDuty || state.todayDuty.status === "已完成";
  const mySlot = state.balcony.slots.find((s) => s.user === myName);
  const laundryDone = !mySlot;
  const expenseConfirmed = state.expenses.every(
    (exp) => exp.confirmations.find((c) => c.member === myName)?.confirmed
  );

  const allTasks: { key: string; icon: AppIconName; label: string; done: boolean; doneText: string }[] = [
    { key: "duty", icon: "broom", label: "值扫", done: dutyDone, doneText: isMyDuty ? "值扫已完成" : "今日无值扫任务" },
    { key: "laundry", icon: "shirt", label: "收衣", done: laundryDone, doneText: "收衣已完成" },
    { key: "expense", icon: "wallet", label: "缴费", done: expenseConfirmed, doneText: `水电${state.utility.perPerson}元已确认` },
  ];

  const doneCount = allTasks.filter((t) => t.done).length;
  const total = allTasks.length;

  return (
    <div>
      {/* Header */}
      <header className="mb-4 flex items-center justify-between rounded-[30px] border border-white/75 bg-white/72 px-4 py-4 shadow-[0_22px_60px_rgba(82,94,72,0.14)] backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-extrabold tracking-[-0.01em] text-[#1F241E]">DormMate AI</h1>
          <p className="mt-1 text-sm font-medium text-[#6F766A]">{state.dormCode} · {myName} · {session.role === "leader" ? "舍长" : "舍友"}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/announcement" className="icon-badge rounded-full bg-[#EEF5E8] text-[#4F5844] transition hover:bg-white hover:text-[#1F241E]">
            <AppIcon name="bell" className="h-5 w-5" />
          </Link>
          <Link href="/profile" className="icon-badge rounded-full bg-[#EEF5E8] text-[#4F5844] transition hover:bg-white hover:text-[#1F241E]">
            <AppIcon name="user" className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Announcement Banner */}
      {ann && (
        <Link href="/announcement" className="block mb-4">
          <div className="card-sage px-4 py-3 transition hover:border-[#A7D86D] hover:bg-white/80">
            <span className="text-sm font-extrabold text-[#5F684D]">公告</span>
            <span className="ml-2 text-sm font-semibold text-[#303229]">{ann.title}</span>
          </div>
        </Link>
      )}

      {/* Roommate Status */}
      <CardShell title="舍友状态">
        <div className="space-y-2">
          {state.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 py-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF0E4] text-sm font-extrabold text-[#4F5844]">
                  {m.avatarInitial}
                </span>
                <span className="text-sm font-bold text-[#303229]">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {m.name === myName && <span className="text-xs font-semibold text-muted-olive">我</span>}
                <StatusBadge label={m.status || "在寝"} variant={statusVariant(m.status)} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-sage-border pt-3">
          <Link href="/status" className="btn-sage inline-flex text-sm">
            更改我的状态
          </Link>
        </div>
      </CardShell>

      {/* Today Tasks */}
      <CardShell title={`今日任务 ${doneCount}/${total}`}>
        {/* Progress bar */}
        <div className="mb-4 h-2 rounded-full bg-[#E7ECDR]">
          <div className="h-2 rounded-full bg-[#A7D86D]" style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>

        {/* Incomplete */}
        {allTasks.some((t) => !t.done) && (
          <>
            <p className="text-xs font-bold text-muted-olive uppercase mb-2">未完成</p>
            <div className="space-y-2 mb-4">
              {allTasks.filter((t) => !t.done).map((task) => (
                <div key={task.key} className="flex items-center justify-between py-2 border-b border-sage-border">
                  <div className="flex items-center gap-2">
                    <span className="icon-badge-sm">
                      <AppIcon name={task.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-sm text-deep-olive">{task.label}</span>
                    {task.key === "duty" && isMyDuty && !dutyDone && (
                      <span className="text-xs text-muted-olive">{state.todayDuty.suggestion}</span>
                    )}
                    {task.key === "laundry" && !laundryDone && mySlot && (
                      <StatusBadge label="待收衣" variant="warning" />
                    )}
                  </div>
                  {task.key === "duty" && isMyDuty && (
                    <button onClick={() => apiPost("duty/complete", { userName: myName })} className="btn-sage text-xs">完成</button>
                  )}
                  {task.key === "laundry" && (
                    <button onClick={() => apiPost("laundry/collect", { userName: myName })} className="btn-sage text-xs">完成</button>
                  )}
                  {task.key === "expense" && (
                    <Link href="/payment" className="btn-sage text-xs">确认</Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Complete */}
        {allTasks.some((t) => t.done) && (
          <>
            <p className="text-xs font-bold text-muted-olive uppercase mb-2">已完成</p>
            <div className="space-y-2">
              {allTasks.filter((t) => t.done).map((task) => (
                <div key={task.key} className="flex items-center gap-2 py-2">
                  <span className="icon-badge-sm icon-badge-dark">
                    <AppIcon name="check" className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-sm text-muted-olive">{task.doneText}</span>
                  <StatusBadge label="已完成" variant="success" />
                </div>
              ))}
            </div>
          </>
        )}
      </CardShell>
    </div>
  );
}
