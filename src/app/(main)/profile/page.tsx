"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import type { DormState } from "@/data/types";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";

export default function ProfilePage() {
  const router = useRouter();
  const { state, session, clearSession, updateNickname, apiPost } = useDorm();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferError, setTransferError] = useState("");
  const [savingTransfer, setSavingTransfer] = useState(false);
  if (!state || !session) return null;

  const currentSession = session;
  const s: DormState = state;
  const dormCode = s.dormCode;
  const otherMembers = s.members.filter((member) => member.name !== currentSession.nickname);
  const pendingForMe = s.leaderTransferRequests.find((item) => item.to === currentSession.nickname);
  const pendingByMe = s.leaderTransferRequests.find((item) => item.from === currentSession.nickname);

  function handleInvite() {
    navigator.clipboard.writeText(dormCode);
  }

  function openNicknameModal() {
    setNickname(currentSession.nickname);
    setNicknameError("");
    setShowNicknameModal(true);
  }

  async function handleRename() {
    const cleanNickname = nickname.trim();
    if (!cleanNickname) {
      setNicknameError("昵称不能为空");
      return;
    }
    setSavingNickname(true);
    const error = await updateNickname(cleanNickname);
    setSavingNickname(false);
    if (error) {
      setNicknameError(error);
      return;
    }
    setShowNicknameModal(false);
  }

  function openTransferModal() {
    setTransferTarget(otherMembers[0]?.name || "");
    setTransferError("");
    setShowTransferModal(true);
  }

  async function handleTransfer(action: "initiate" | "accept" | "reject" | "cancel", requestId?: string) {
    if (action === "initiate" && !transferTarget) {
      setTransferError("请选择一名舍友");
      return;
    }

    setSavingTransfer(true);
    setTransferError("");
    const error = await apiPost("leader/transfer", {
      action,
      targetMember: transferTarget,
      requestId,
    });
    setSavingTransfer(false);
    if (error) {
      setTransferError(error);
      return;
    }
    setShowTransferModal(false);
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
        <p className="text-sm text-olive-ink">我的昵称：<strong>{currentSession.nickname}</strong></p>
        <p className="text-sm text-olive-ink">当前身份：<strong>{currentSession.role === "leader" ? "舍长" : "舍友"}</strong></p>
        <div className="flex gap-3 mt-3">
          <button onClick={handleInvite} className="btn-sage text-sm">邀请舍友</button>
        </div>
      </CardShell>

      {(currentSession.role === "leader" || pendingForMe || pendingByMe) && (
        <CardShell title="舍长身份转换">
          {currentSession.role === "leader" && !pendingByMe && (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-deep-olive">转让舍长权限</p>
                <p className="mt-1 text-xs text-muted-olive">选择一名舍友，对方同意后完成身份和权限转移。</p>
              </div>
              <button onClick={openTransferModal} className="btn-dark shrink-0 text-sm" disabled={otherMembers.length === 0}>
                发起
              </button>
            </div>
          )}

          {pendingByMe && (
            <div className="rounded-[18px] bg-[#F6F8F2] p-3">
              <p className="text-sm font-bold text-deep-olive">等待 {pendingByMe.to} 同意</p>
              <p className="mt-1 text-xs text-muted-olive">对方同意后，你将变为舍友。</p>
              <button
                onClick={() => handleTransfer("cancel", pendingByMe.id)}
                disabled={savingTransfer}
                className="btn-sage mt-3 text-sm disabled:cursor-not-allowed"
              >
                取消申请
              </button>
            </div>
          )}

          {pendingForMe && (
            <div className="rounded-[18px] bg-[#F6F8F2] p-3">
              <p className="text-sm font-bold text-deep-olive">{pendingForMe.from} 邀请你成为舍长</p>
              <p className="mt-1 text-xs text-muted-olive">同意后，你将获得舍长权限，对方转为舍友。</p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => handleTransfer("reject", pendingForMe.id)}
                  disabled={savingTransfer}
                  className="btn-sage flex-1 text-center disabled:cursor-not-allowed"
                >
                  拒绝
                </button>
                <button
                  onClick={() => handleTransfer("accept", pendingForMe.id)}
                  disabled={savingTransfer}
                  className="btn-dark flex-1 text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none"
                >
                  同意
                </button>
              </div>
            </div>
          )}

          {transferError && (
            <p className="mt-3 rounded-[16px] bg-[#FFF8ED] px-3 py-2 text-sm font-bold text-[#8A5A25]">
              {transferError}
            </p>
          )}
        </CardShell>
      )}

      {/* Settings */}
      <CardShell title="基础设置">
        <div className="space-y-0">
          <button onClick={openNicknameModal} className="flex items-center justify-between w-full py-3 px-0 border-b border-[#E3E8DD] hover:text-[#1F241E] transition-colors text-sm text-olive-ink">
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

      {showNicknameModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]" onClick={() => setShowNicknameModal(false)} />
          <div className="relative w-full rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_24px_70px_rgba(32,37,30,0.22)] backdrop-blur-xl">
            <h3 className="mb-3 text-lg font-bold text-deep-olive">修改昵称</h3>
            <label className="mb-1 block text-sm font-semibold text-deep-olive">新昵称</label>
            <input
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setNicknameError("");
              }}
              className="input-default"
              placeholder="输入新昵称"
            />
            {nicknameError && (
              <p className="mt-3 rounded-[16px] bg-[#FFF8ED] px-3 py-2 text-sm font-bold text-[#8A5A25]">
                {nicknameError}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowNicknameModal(false)} className="btn-sage flex-1 text-center">取消</button>
              <button
                onClick={handleRename}
                disabled={savingNickname}
                className="btn-dark flex-1 text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none"
              >
                {savingNickname ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]" onClick={() => setShowTransferModal(false)} />
          <div className="relative w-full rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_24px_70px_rgba(32,37,30,0.22)] backdrop-blur-xl">
            <h3 className="mb-3 text-lg font-bold text-deep-olive">更换舍长</h3>
            <label className="mb-1 block text-sm font-semibold text-deep-olive">选择舍友</label>
            <select
              value={transferTarget}
              onChange={(event) => {
                setTransferTarget(event.target.value);
                setTransferError("");
              }}
              className="input-default"
            >
              {otherMembers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs text-muted-olive">对方同意后，舍长身份和管理权限会立即转移。</p>
            {transferError && (
              <p className="mt-3 rounded-[16px] bg-[#FFF8ED] px-3 py-2 text-sm font-bold text-[#8A5A25]">
                {transferError}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowTransferModal(false)} className="btn-sage flex-1 text-center">取消</button>
              <button
                onClick={() => handleTransfer("initiate")}
                disabled={savingTransfer || !transferTarget}
                className="btn-dark flex-1 text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none"
              >
                {savingTransfer ? "发送中..." : "发送申请"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
