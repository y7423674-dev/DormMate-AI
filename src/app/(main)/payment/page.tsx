"use client";

import Link from "next/link";
import { useState } from "react";
import { useDorm } from "@/app/DormProvider";
import type { ExpenseRecord } from "@/data/types";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

export default function PaymentPage() {
  const { state, session, apiPost } = useDorm();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [splitMethod, setSplitMethod] = useState<"equal" | "creatorOnly">("equal");
  const [confirmingExpense, setConfirmingExpense] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (!state || !session) return null;

  const myName = session.nickname;
  const isLeader = session.role === "leader";
  const isCreator = (exp: ExpenseRecord) => exp.creator === myName;

  function handleConfirm(expenseId: string) {
    apiPost("expense/confirm", { expenseId, memberName: myName });
  }

  async function handleDelete(expenseId: string) {
    if (!isLeader) {
      setFeedback("只有舍长可以删除缴费记录。");
      return;
    }
    setSubmitting(true);
    await apiPost("expense/delete", { expenseId, memberName: myName });
    setSubmitting(false);
    setFeedback("缴费记录已删除。");
  }

  function resetAddExpenseForm() {
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseNote("");
    setSplitMethod("equal");
    setConfirmingExpense(false);
    setFormError("");
  }

  function validateExpenseForm() {
    const amount = Number(expenseAmount);
    if (!expenseTitle.trim()) {
      setFormError("请填写支出标题");
      return null;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("请输入有效金额");
      return null;
    }
    setFormError("");
    return amount;
  }

  function handlePreviewExpense() {
    if (!validateExpenseForm()) return;
    setConfirmingExpense(true);
  }

  async function handleAddExpense() {
    const amount = validateExpenseForm();
    if (!amount) return;

    setFormError("");
    setSubmitting(true);
    await apiPost("expense/add", {
      title: expenseTitle.trim(),
      amount: String(amount),
      creator: myName,
      note: expenseNote.trim(),
      splitMethod,
    });
    setSubmitting(false);
    resetAddExpenseForm();
    setShowAddForm(false);
  }

  // Calendar data for June 2026
  const daysInMonth = 30;
  const firstDayOffset = 1; // June 1 is Monday
  const expenseDays = [1, 3, 8, 12, 15, 20, 24, 28]; // Days with expenses (mock)

  return (
    <div>
      <PageHeader
        title="缴费"
        rightContent={
          <Link href="/payment/report" className="btn-tan text-sm">
            月报[AI报表]
          </Link>
        }
      />

      {/* Calendar */}
      <CardShell title="">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-deep-olive">2026年 6月</span>
          <span className="text-sm text-muted-olive">&lt; 6月 &gt;</span>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <span key={d} className="text-xs font-bold text-muted-olive uppercase text-center">{d}</span>
          ))}
        </div>
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Offset for first day */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <span key={`offset-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasExpense = expenseDays.includes(day);
            return (
              <span
                key={day}
                className="text-center py-1 text-sm text-olive-ink relative"
              >
                {day}
                {hasExpense && (
                  <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-pill bg-[#A7D86D]" />
                )}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-muted-olive mt-2">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-pill bg-[#A7D86D]" /> 有支出记录
        </p>
      </CardShell>

      {/* Expense Cards */}
      <p className="text-sm font-bold text-deep-olive mb-2">6月1日支出记录</p>
      {feedback && (
        <p className="mb-3 rounded-[18px] border border-white/75 bg-[#EEF5E8] px-3 py-2 text-sm font-semibold text-[#5F684D]">
          {feedback}
        </p>
      )}
      {state.expenses.map((exp) => {
        const confirmedCount = exp.confirmations.filter((c) => c.confirmed).length;
        const total = exp.confirmations.length;
        const confirmedByMe = exp.confirmations.find((c) => c.member === myName)?.confirmed;
        return (
          <CardShell key={exp.id} title="">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-deep-olive">{exp.title}</span>
              <span className="text-lg font-bold text-deep-olive">{exp.amount}元</span>
            </div>
            <p className="text-sm text-muted-olive">创建者：{exp.creator}</p>
            <p className="text-sm text-muted-olive">分摊方式：{exp.splitMethod}</p>
            <p className="text-sm text-muted-olive">人均金额：{exp.perPerson}元</p>
            <p className="text-sm text-muted-olive">备注：{exp.note}</p>

            {/* Completion */}
            <p className="text-sm text-muted-olive mt-3">完成情况：{confirmedCount}/{total}人</p>
            <div className="space-y-1 mt-2">
              {exp.confirmations.map((c) => (
                <div key={c.member} className="flex items-center gap-2 text-sm">
                  <span className="text-deep-olive">{c.member}</span>
                  <StatusBadge
                    label={c.confirmed ? "已完成" : "未完成"}
                    variant={c.confirmed ? "success" : "warning"}
                  />
                </div>
              ))}
            </div>

            {/* Role-based buttons */}
            <div className="flex gap-2 mt-4">
              {isCreator(exp) && (
                <button className="btn-sage text-sm">编辑</button>
              )}
              {isLeader && (
                <button
                  onClick={() => handleDelete(exp.id)}
                  disabled={submitting}
                  className="btn-sage text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  删除
                </button>
              )}
              {!isCreator(exp) && !confirmedByMe && (
                <button
                  onClick={() => handleConfirm(exp.id)}
                  className="btn-dark text-sm"
                >
                  我已完成
                </button>
              )}
            </div>
          </CardShell>
        );
      })}

      {/* Add expense */}
      <div className="card-sage border-dashed border-2 p-0 text-center">
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full rounded-[24px] px-4 py-4 transition hover:bg-white/55 active:scale-[0.99]"
        >
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-2xl font-extrabold text-[#5F684D] shadow-[0_10px_22px_rgba(82,94,72,0.1)]">
            +
          </span>
          <p className="mt-2 text-sm font-semibold text-muted-olive">新增支出记录</p>
        </button>
      </div>

      {showAddForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.3)]"
            onClick={() => {
              setShowAddForm(false);
              resetAddExpenseForm();
            }}
          />
          <div className="relative max-h-[78vh] w-full overflow-y-auto rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_24px_70px_rgba(32,37,30,0.22)] backdrop-blur-xl">
              {!confirmingExpense ? (
                <>
                  <h3 className="mb-3 text-lg font-bold text-deep-olive">新增支出记录</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-deep-olive">支出标题</label>
                      <input
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="input-default"
                        placeholder="例如：公共用品"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-deep-olive">总金额</label>
                      <input
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        inputMode="decimal"
                        className="input-default"
                        placeholder="例如：24"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-deep-olive">分摊方式</label>
                      <div className="grid grid-cols-2 gap-1.5 rounded-full border border-[#E3E8DD] bg-[#EEF3E8]/90 p-1.5">
                        <button
                          type="button"
                          onClick={() => setSplitMethod("equal")}
                          className={`rounded-full px-3 py-2 text-sm font-extrabold transition ${
                            splitMethod === "equal"
                              ? "bg-[#20251E] text-white shadow-[0_10px_20px_rgba(32,37,30,0.16)]"
                              : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
                          }`}
                        >
                          全员平摊
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitMethod("creatorOnly")}
                          className={`rounded-full px-3 py-2 text-sm font-extrabold transition ${
                            splitMethod === "creatorOnly"
                              ? "bg-[#20251E] text-white shadow-[0_10px_20px_rgba(32,37,30,0.16)]"
                              : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
                          }`}
                        >
                          仅我支付
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-deep-olive">备注</label>
                      <textarea
                        value={expenseNote}
                        onChange={(e) => setExpenseNote(e.target.value)}
                        className="input-default min-h-[78px] resize-none"
                        placeholder="例如：洗洁精、垃圾袋"
                      />
                    </div>
                    <div className="rounded-[18px] bg-[#EEF5E8] px-3 py-2 text-left">
                      <p className="text-sm font-semibold text-[#5F684D]">
                        {splitMethod === "equal"
                          ? `分摊方式：${state.members.length}人平摊`
                          : "分摊方式：仅记录为个人支付"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-olive">
                        你作为创建者会自动标记为已完成。
                      </p>
                    </div>
                    {formError && (
                      <p className="rounded-[16px] bg-[#FFF8ED] px-3 py-2 text-sm font-bold text-[#8A5A25]">
                        {formError}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        resetAddExpenseForm();
                      }}
                      className="btn-sage flex-1 text-center"
                    >
                      取消
                    </button>
                    <button onClick={handlePreviewExpense} className="btn-dark flex-1 text-center">
                      下一步
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mb-3 text-lg font-bold text-deep-olive">确认支出记录</h3>
                  <div className="space-y-2 rounded-[22px] bg-[#EEF5E8] p-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-olive">标题</span>
                      <strong className="text-right text-deep-olive">{expenseTitle.trim()}</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-olive">总金额</span>
                      <strong className="text-deep-olive">{Number(expenseAmount).toFixed(2)}元</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-olive">分摊方式</span>
                      <strong className="text-right text-deep-olive">
                        {splitMethod === "equal" ? `${state.members.length}人平摊` : "个人支付"}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-olive">人均金额</span>
                      <strong className="text-deep-olive">
                        {splitMethod === "equal"
                          ? (Number(expenseAmount) / Math.max(state.members.length, 1)).toFixed(2)
                          : Number(expenseAmount).toFixed(2)}
                        元
                      </strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-olive">创建者</span>
                      <strong className="text-deep-olive">{myName}</strong>
                    </div>
                    <div>
                      <span className="text-muted-olive">备注</span>
                      <p className="mt-1 font-semibold text-deep-olive">{expenseNote.trim() || "无备注"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-muted-olive">
                    确认后将生成支出记录，并出现在缴费列表中。
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => setConfirmingExpense(false)} className="btn-sage flex-1 text-center">
                      返回修改
                    </button>
                    <button
                      onClick={handleAddExpense}
                      disabled={submitting}
                      className="btn-dark flex-1 text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none"
                    >
                      {submitting ? "生成中..." : "确认生成记录"}
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
