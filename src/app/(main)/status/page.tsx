"use client";

import { useState } from "react";
import { useDorm } from "@/app/DormProvider";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

function statusVariant(status: string) {
  if (status === "熟睡" || status === "在寝") return "success";
  if (status === "晚归" || status === "未完成") return "warning";
  if (status === "勿扰") return "danger";
  return "default";
}

const statusOptions = ["在寝", "熟睡", "晚归", "勿扰", "早八", "请假", "自习", "外出"];

export default function StatusPage() {
  const { state, session, apiPost } = useDorm();
  const [customStatus, setCustomStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!state || !session) return null;

  const myName = session.nickname;
  const myMember = state.members.find((member) => member.name === myName);
  const myStatus = myMember?.status || "在寝";

  async function updateStatus(status: string) {
    const cleanStatus = status.trim();
    if (!cleanStatus) {
      setFormError("请填写状态");
      return;
    }
    if ([...cleanStatus].length > 4) {
      setFormError("状态不能超过四字");
      return;
    }
    if (cleanStatus === myStatus) {
      setFormError("");
      setFeedback("当前已经是这个状态。");
      return;
    }

    setFormError("");
    setFeedback("");
    setSubmitting(true);
    await apiPost("member/status", { userName: myName, status: cleanStatus });
    setSubmitting(false);
    setCustomStatus("");
    setFeedback(`已更新为${cleanStatus}`);
  }

  return (
    <div>
      <PageHeader title="更改状态" showBack backHref="/dashboard" />

      <CardShell title="当前状态">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-deep-olive">{myName}</p>
            <p className="mt-1 text-xs font-medium text-muted-olive">状态最多四字</p>
          </div>
          <StatusBadge label={myStatus} variant={statusVariant(myStatus)} />
        </div>
        {feedback && (
          <p className="mt-3 rounded-[18px] border border-white/75 bg-[#EEF5E8] px-3 py-2 text-sm font-semibold text-[#5F684D]">
            {feedback}
          </p>
        )}
      </CardShell>

      <CardShell title="常用状态">
        <div className="grid grid-cols-4 gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateStatus(status)}
              disabled={submitting}
              className={`rounded-[18px] px-3 py-2 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                myStatus === status
                  ? "bg-[#20251E] text-white shadow-[0_10px_20px_rgba(32,37,30,0.16)]"
                  : "border border-[#E3E8DD] bg-[#EEF5E8] text-olive-ink hover:bg-white/75 hover:text-[#1F241E]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </CardShell>

      <CardShell title="自定义状态">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-deep-olive">状态文字</label>
            <input
              value={customStatus}
              onChange={(e) => {
                setCustomStatus([...e.target.value].slice(0, 4).join(""));
                setFormError("");
              }}
              className="input-default"
              maxLength={4}
              placeholder="四字以内"
            />
            <p className="mt-1 text-xs font-medium text-muted-olive">{[...customStatus].length}/4</p>
          </div>
          {formError && (
            <p className="rounded-[16px] bg-[#FFF8ED] px-3 py-2 text-sm font-bold text-[#8A5A25]">
              {formError}
            </p>
          )}
          <button
            type="button"
            onClick={() => updateStatus(customStatus)}
            disabled={submitting}
            className="btn-dark w-full text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none"
          >
            {submitting ? "保存中..." : "保存状态"}
          </button>
        </div>
      </CardShell>
    </div>
  );
}
