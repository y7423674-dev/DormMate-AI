"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

function statusVariant(status: string) {
  if (status === "在寝") return "success";
  if (status === "晚归") return "warning";
  if (status === "勿扰") return "danger";
  return "default";
}

export default function SwapPage() {
  const router = useRouter();
  const { state, session, apiPost } = useDorm();
  const [swapType, setSwapType] = useState<"exchange" | "makeup">("exchange");
  const [selectedMember, setSelectedMember] = useState("");
  const [explanation, setExplanation] = useState("");

  if (!state || !session) return null;

  const myName = session.nickname;
  const otherMembers = state.members.filter((m) => m.name !== myName);

  async function handleSubmit() {
    if (swapType === "exchange" && !selectedMember) return;
    await apiPost("duty/swap", { swapType, userName: myName, targetMember: selectedMember });
    router.push("/duty");
  }

  return (
    <div>
      <PageHeader title="换班" showBack backHref="/duty" />

      {/* Swap Method */}
      <CardShell title="换班方式">
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer rounded-[18px] p-3 hover:bg-white/65 transition-colors">
            <input
              type="radio"
              name="swapType"
              checked={swapType === "exchange"}
              onChange={() => setSwapType("exchange")}
              className="mt-1 accent-[#A7D86D]"
            />
            <div>
              <p className="text-sm font-bold text-deep-olive">交换值扫</p>
              <p className="text-sm text-muted-olive">我和对方互换一次值扫</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer rounded-[18px] p-3 hover:bg-white/65 transition-colors">
            <input
              type="radio"
              name="swapType"
              checked={swapType === "makeup"}
              onChange={() => setSwapType("makeup")}
              className="mt-1 accent-[#A7D86D]"
            />
            <div>
              <p className="text-sm font-bold text-deep-olive">申请补扫</p>
              <p className="text-sm text-muted-olive">本次请假，之后补一次</p>
            </div>
          </label>
        </div>
      </CardShell>

      {swapType === "exchange" && (
        <CardShell title="选择舍友">
          <div className="space-y-2">
            {otherMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m.name)}
                className={`flex items-center gap-3 rounded-[18px] p-3 cursor-pointer transition-colors ${
                  selectedMember === m.name
                    ? "border border-[#A7D86D] bg-white/78 shadow-[0_10px_22px_rgba(82,94,72,0.1)]"
                    : "hover:bg-white/65"
                }`}
              >
                <span className="w-7 h-7 rounded-pill bg-light-sage flex items-center justify-center text-sm font-bold text-olive-ink">
                  {m.avatarInitial}
                </span>
                <span className="text-sm font-semibold text-deep-olive">{m.name}</span>
                <StatusBadge label={m.status || "在寝"} variant={statusVariant(m.status)} />
              </div>
            ))}
          </div>
        </CardShell>
      )}

      {/* Explanation */}
      <CardShell title="换班说明">
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder={swapType === "exchange" ? "今天晚上有事，想和小王换一下值扫。" : "今天晚上有事，后面补扫一次。"}
          className="input-default min-h-[80px] resize-y"
        />
      </CardShell>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.push("/duty")} className="btn-sage flex-1 text-center">取消</button>
        <button
          onClick={handleSubmit}
          disabled={swapType === "exchange" && !selectedMember}
          className="btn-dark flex-1 text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none"
        >
          提交申请
        </button>
      </div>
    </div>
  );
}
