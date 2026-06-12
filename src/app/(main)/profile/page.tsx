"use client";

import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import type { DormState } from "@/data/types";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";

export default function ProfilePage() {
  const router = useRouter();
  const { state, session, clearSession } = useDorm();
  if (!state || !session) return null;

  const s: DormState = state;
  const dormCode = s.dormCode;

  function handleCopy() {
    navigator.clipboard.writeText(dormCode);
  }

  function handleSwitch() {
    clearSession();
    router.push("/");
  }

  function handleClear() {
    clearSession();
    router.push("/");
  }

  return (
    <div>
      <PageHeader title="我的" />

      {/* Dorm Info */}
      <CardShell title="当前宿舍">
        <p className="text-sm text-olive-ink">宿舍邀请码：<strong>{dormCode}</strong></p>
        <p className="text-sm text-olive-ink">我的昵称：<strong>{session.nickname}</strong></p>
        <p className="text-sm text-olive-ink">当前身份：<strong>{session.role === "leader" ? "舍长" : "舍友"}</strong></p>
        <div className="flex gap-3 mt-3">
          <button onClick={handleCopy} className="btn-sage text-sm">复制邀请码</button>
          <button className="btn-sage text-sm">邀请舍友</button>
        </div>
      </CardShell>

      {/* Settings */}
      <CardShell title="基础设置">
        <div className="space-y-0">
          <button onClick={handleSwitch} className="flex items-center justify-between w-full py-3 px-0 border-b border-[#E3E8DD] hover:text-[#1F241E] transition-colors text-sm text-olive-ink">
            修改昵称 <span>→</span>
          </button>
          <button onClick={handleSwitch} className="flex items-center justify-between w-full py-3 px-0 border-b border-[#E3E8DD] hover:text-[#1F241E] transition-colors text-sm text-olive-ink">
            切换宿舍 <span>→</span>
          </button>
          <button onClick={handleClear} className="flex items-center justify-between w-full py-3 px-0 hover:text-[#1F241E] transition-colors text-sm text-olive-ink">
            清空本地缓存 <span>→</span>
          </button>
        </div>
      </CardShell>

      {/* About */}
      <CardShell title="关于">
        <div className="space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-[#E3E8DD] text-sm text-olive-ink">
            关于 DormMate AI <span>→</span>
          </div>
          <div className="py-3 text-sm text-muted-olive">
            版本信息：V0.1 Demo
          </div>
        </div>
      </CardShell>
    </div>
  );
}
