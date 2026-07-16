"use client";

import { useState } from "react";
import { useDorm } from "@/app/DormProvider";
import AppIcon from "@/components/AppIcon";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

export default function AnnouncementPage() {
  const { state, session, apiPost } = useDorm();
  const [showAddHint, setShowAddHint] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinNewAnnouncement, setPinNewAnnouncement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  if (!state || !session) return null;

  const isLeader = session.role === "leader";
  const pinned = state.announcements.find((a) => a.pinned);

  function handleRead() {
    if (!pinned) return;
    apiPost("announcement/read", { announcementId: pinned.id });
  }

  async function handleAddAnnouncement() {
    if (!session) return;
    if (!title.trim() || !content.trim()) {
      setFormError("请填写公告标题和内容");
      return;
    }
    setFormError("");
    setSubmitting(true);
    const error = await apiPost("announcement/add", {
      title: title.trim(),
      content: content.trim(),
      pinned: isLeader && pinNewAnnouncement,
    });
    setSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setTitle("");
    setContent("");
    setPinNewAnnouncement(false);
    setShowAddHint(false);
  }

  return (
    <div>
      <PageHeader title="公告栏" showBack backHref="/dashboard" />

      {/* Add Announcement */}
      <CardShell variant="sage" className="border-dashed !border-2 !p-0">
        <button
          type="button"
          onClick={() => setShowAddHint((open) => !open)}
          className="w-full rounded-[24px] px-4 py-4 text-center transition hover:bg-white/55 active:scale-[0.99]"
        >
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-xl font-extrabold text-[#5F684D] shadow-[0_10px_22px_rgba(82,94,72,0.1)]">
            +
          </span>
          <p className="mt-2 text-sm font-semibold text-muted-olive">添加公告</p>
          <p className="mt-1 text-xs font-medium text-[#8A9285]">点击查看发布说明</p>
        </button>
      </CardShell>

      {showAddHint && (
        <div className="mb-3 rounded-[22px] border border-white/75 bg-white/72 p-4 shadow-[0_14px_34px_rgba(82,94,72,0.12)] backdrop-blur-xl">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#3A4035]">公告标题</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-default"
                placeholder="例如：周五晚宿舍大扫除"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#3A4035]">公告内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-default min-h-[82px] resize-none"
                placeholder="写下需要同步给舍友的事项..."
              />
            </div>
            {isLeader && (
              <label className="flex items-center justify-between rounded-[18px] bg-[#F6F8F2] px-3 py-3 text-sm font-bold text-deep-olive">
                <span>置顶这条公告</span>
                <input
                  type="checkbox"
                  checked={pinNewAnnouncement}
                  onChange={(e) => setPinNewAnnouncement(e.target.checked)}
                  className="h-5 w-5 accent-[#20251E]"
                />
              </label>
            )}
            {formError && (
              <p className="text-sm font-bold text-[#8A5A25]">{formError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddHint(false);
                  setPinNewAnnouncement(false);
                  setFormError("");
                }}
                className="btn-sage flex-1 text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddAnnouncement}
                disabled={submitting}
                className="btn-dark flex-1 text-sm disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none"
              >
                {submitting ? "发布中..." : "发布公告"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned Announcement */}
      {pinned && (
        <CardShell title="">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#5F684D]">
            <span className="icon-badge-sm">
              <AppIcon name="pin" className="h-[18px] w-[18px]" />
            </span>
            置顶公告
          </span>
          <h3 className="text-lg font-bold text-deep-olive mt-2">{pinned.title}</h3>
          <p className="text-sm text-muted-olive">{pinned.date} · {pinned.author}发布</p>
          <p className="text-sm text-olive-ink mt-2 leading-relaxed">{pinned.content}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-olive">已读 {pinned.readCount}/{pinned.totalMembers}</span>
            {!pinned.readByMe && (
              <button onClick={handleRead} className="btn-sage text-sm">我知道了</button>
            )}
            {pinned.readByMe && (
              <StatusBadge label="已读" variant="success" />
            )}
          </div>
        </CardShell>
      )}

      <div className="mb-2 px-1 text-sm font-extrabold text-[#5F684D]">全部公告</div>
      {state.announcements.map((ann) => (
        <CardShell key={ann.id} title="">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-deep-olive">{ann.title}</h3>
            {ann.pinned && <StatusBadge label="置顶" variant="warning" />}
          </div>
          <p className="text-sm text-muted-olive">{ann.date} · {ann.author}发布</p>
          <p className="text-sm text-olive-ink mt-2 leading-relaxed">{ann.content}</p>
          <div className="mt-3 text-sm text-muted-olive">
            已读 {ann.readCount}/{ann.totalMembers}
          </div>
        </CardShell>
      ))}
    </div>
  );
}
