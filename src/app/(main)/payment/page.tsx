"use client";

import Link from "next/link";
import { useState } from "react";
import { useDorm } from "@/app/DormProvider";
import type { ExpenseRecord } from "@/data/types";
import { compareDateISO, formatShortDate, toDateISO } from "@/lib/dateUtils";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

type SplitMethod = "equal" | "creatorOnly" | "ratio";

function isCreatorOnlyExpense(exp: ExpenseRecord) {
  return exp.splitMethod === "个人支付";
}

function getExpenseDateISO(exp: ExpenseRecord, fallbackYear: number) {
  if (exp.dateISO) return exp.dateISO;
  const match = exp.date.match(/(\d+)月(\d+)日/u);
  if (!match) return "";
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `${fallbackYear}-${month}-${day}`;
}

export default function PaymentPage() {
  const { state, session, apiPost } = useDorm();
  const today = new Date();
  const todayISO = toDateISO(today);
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedExpenseDate, setSelectedExpenseDate] = useState(todayISO);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [splitRatios, setSplitRatios] = useState<Record<string, string>>({});
  const [confirmingExpense, setConfirmingExpense] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (!state || !session) return null;

  const myName = session.nickname;
  const isLeader = session.role === "leader";
  const isCreator = (exp: ExpenseRecord) => exp.creator === myName;
  const ratioTotal = state.members.reduce((sum, member) => {
    const ratio = Number(splitRatios[member.name] || 0);
    return sum + (Number.isFinite(ratio) && ratio > 0 ? ratio : 0);
  }, 0);
  const monthYear = monthCursor.getFullYear();
  const monthIndex = monthCursor.getMonth();
  const monthNumber = monthIndex + 1;
  const daysInMonth = new Date(monthYear, monthNumber, 0).getDate();
  const firstDayOffset = (new Date(monthYear, monthIndex, 1).getDay() + 6) % 7;
  const monthKey = `${monthYear}-${String(monthNumber).padStart(2, "0")}`;
  const monthlyExpenses = state.expenses.filter((expense) => getExpenseDateISO(expense, monthYear).startsWith(monthKey));
  const expenseDays = new Set(
    monthlyExpenses
      .map((expense) => getExpenseDateISO(expense, monthYear))
      .filter((dateISO) => dateISO && compareDateISO(dateISO, todayISO) <= 0)
      .map((dateISO) => Number(dateISO.slice(-2)))
  );
  const selectedDayExpenses = state.expenses.filter((expense) => getExpenseDateISO(expense, monthYear) === selectedExpenseDate);
  const selectedDayTotal = selectedDayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  function changeMonth(offset: number) {
    setMonthCursor((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      const nextISO =
        next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth()
          ? todayISO
          : toDateISO(next);
      setSelectedExpenseDate(nextISO);
      return next;
    });
  }

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
    setSplitRatios({});
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
    if (splitMethod === "ratio") {
      if (ratioTotal <= 0) {
        setFormError("请至少填写一个有效比例");
        return null;
      }
      if (ratioTotal > 100) {
        setFormError("按比例收费的总比例不能超过100%");
        return null;
      }
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
      splitShares: splitMethod === "ratio" ? splitRatios : undefined,
    });
    setSubmitting(false);
    resetAddExpenseForm();
    setShowAddForm(false);
  }

  return (
    <div>
      <PageHeader
        title="缴费"
        rightContent={
          <Link href="/payment/report" className="btn-tan text-sm">
            月报分析
          </Link>
        }
      />

      {/* Calendar */}
      <CardShell title="">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => changeMonth(-1)} className="btn-sage px-3 py-1.5 text-xs">
            &lt;
          </button>
          <span className="text-base font-bold text-deep-olive">{monthYear}年 {monthNumber}月</span>
          <button type="button" onClick={() => changeMonth(1)} className="btn-sage px-3 py-1.5 text-xs">
            &gt;
          </button>
        </div>
        <p className="mb-3 text-center text-xs font-semibold text-muted-olive">今天：{formatShortDate(today)}</p>
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
            const dateISO = `${monthKey}-${String(day).padStart(2, "0")}`;
            const hasExpense = expenseDays.has(day) && compareDateISO(dateISO, todayISO) <= 0;
            const isToday = dateISO === todayISO;
            const isSelected = dateISO === selectedExpenseDate;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedExpenseDate(dateISO)}
                className={`relative rounded-full py-1 text-center text-sm font-semibold transition ${
                  isSelected
                    ? "bg-[#20251E] text-white shadow-[0_8px_18px_rgba(32,37,30,0.16)]"
                    : isToday
                      ? "bg-[#EEF5E8] font-extrabold text-[#20251E]"
                    : compareDateISO(dateISO, todayISO) > 0
                      ? "text-[#B8BEB2]"
                      : "text-olive-ink hover:bg-[#EEF5E8]"
                }`}
              >
                {day}
                {hasExpense && (
                  <span className={`absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-pill ${isSelected ? "bg-white" : "bg-[#A7D86D]"}`} />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-olive mt-2">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-pill bg-[#A7D86D]" /> 有支出记录
        </p>
      </CardShell>

      <CardShell title="">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-deep-olive">{selectedExpenseDate} 支出</p>
            <p className="text-xs font-semibold text-muted-olive">
              {selectedDayExpenses.length > 0 ? `${selectedDayExpenses.length} 笔记录` : "暂无支出记录"}
            </p>
          </div>
          <span className="rounded-[16px] bg-[#EEF5E8] px-3 py-1.5 text-sm font-extrabold text-[#5F684D]">
            {selectedDayTotal.toFixed(2)}元
          </span>
        </div>
        {selectedDayExpenses.length === 0 ? (
          <p className="rounded-[18px] bg-white/55 px-3 py-3 text-center text-sm font-semibold text-muted-olive">
            当天没有登记支出。
          </p>
        ) : (
          <div className="space-y-2">
            {selectedDayExpenses.map((exp) => (
              <div key={exp.id} className="rounded-[18px] bg-white/55 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-bold text-deep-olive">{exp.title}</span>
                  <span className="whitespace-nowrap text-sm font-extrabold text-deep-olive">{exp.amount}元</span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-muted-olive">
                  {exp.creator} · {exp.splitMethod}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardShell>

      {/* Expense Cards */}
      <p className="text-sm font-bold text-deep-olive mb-2">{monthNumber}月支出记录</p>
      {feedback && (
        <p className="mb-3 rounded-[18px] border border-white/75 bg-[#EEF5E8] px-3 py-2 text-sm font-semibold text-[#5F684D]">
          {feedback}
        </p>
      )}
      {monthlyExpenses.length === 0 && (
        <CardShell title="">
          <p className="py-2 text-center text-sm font-semibold text-muted-olive">这个月暂无支出记录</p>
        </CardShell>
      )}
      {monthlyExpenses.map((exp) => {
        const confirmedCount = exp.confirmations.filter((c) => c.confirmed).length;
        const total = exp.confirmations.length;
        const confirmedByMe = exp.confirmations.find((c) => c.member === myName)?.confirmed;
        const creatorOnly = isCreatorOnlyExpense(exp);
        const ratioSplit = Boolean(exp.splitShares?.length);
        return (
          <CardShell key={exp.id} title="">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-deep-olive">{exp.title}</span>
              <span className="text-lg font-bold text-deep-olive">{exp.amount}元</span>
            </div>
            <p className="text-sm text-muted-olive">创建者：{exp.creator}</p>
            <p className="text-sm text-muted-olive">分摊方式：{exp.splitMethod}</p>
            {!ratioSplit && (
              <p className="text-sm text-muted-olive">
                {creatorOnly ? "个人金额" : "人均金额"}：{exp.perPerson}元
              </p>
            )}
            <p className="text-sm text-muted-olive">备注：{exp.note}</p>
            {ratioSplit && (
              <div className="mt-3 space-y-1 rounded-[18px] bg-[#EEF5E8] px-3 py-2">
                {exp.splitShares?.map((share) => (
                  <div key={share.member} className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-deep-olive">{share.member}</span>
                    <span className="text-muted-olive">{share.ratio}% · {share.amount}元</span>
                  </div>
                ))}
              </div>
            )}

            {/* Completion */}
            {!creatorOnly && (
              <>
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
              </>
            )}

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
              {!creatorOnly && !isCreator(exp) && !confirmedByMe && (
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
                      <div className="grid grid-cols-3 gap-1.5 rounded-[22px] border border-[#E3E8DD] bg-[#EEF3E8]/90 p-1.5">
                        <button
                          type="button"
                          onClick={() => setSplitMethod("equal")}
                          className={`rounded-[16px] px-2 py-2 text-xs font-extrabold transition ${
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
                          className={`rounded-[16px] px-2 py-2 text-xs font-extrabold transition ${
                            splitMethod === "creatorOnly"
                              ? "bg-[#20251E] text-white shadow-[0_10px_20px_rgba(32,37,30,0.16)]"
                              : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
                          }`}
                        >
                          仅我支付
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitMethod("ratio")}
                          className={`rounded-[16px] px-2 py-2 text-xs font-extrabold transition ${
                            splitMethod === "ratio"
                              ? "bg-[#20251E] text-white shadow-[0_10px_20px_rgba(32,37,30,0.16)]"
                              : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
                          }`}
                        >
                          按比例
                        </button>
                      </div>
                    </div>
                    {splitMethod === "ratio" && (
                      <div className="rounded-[20px] border border-[#E3E8DD] bg-[#F6F8F2]/90 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-semibold text-deep-olive">比例设置</label>
                          <span className="text-xs font-bold text-muted-olive">
                            合计 {ratioTotal}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          {state.members.map((member) => (
                            <div key={member.id} className="grid grid-cols-[1fr_92px] items-center gap-2">
                              <span className="text-sm font-semibold text-deep-olive">{member.name}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  value={splitRatios[member.name] || ""}
                                  onChange={(e) => setSplitRatios((prev) => ({ ...prev, [member.name]: e.target.value }))}
                                  inputMode="decimal"
                                  className="input-default px-3 py-2 text-right text-sm"
                                  placeholder="0"
                                />
                                <span className="text-sm font-bold text-muted-olive">%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                          : splitMethod === "creatorOnly"
                            ? "分摊方式：仅记录为个人支付"
                            : "分摊方式：按比例收费"}
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
                        {splitMethod === "equal"
                          ? `${state.members.length}人平摊`
                          : splitMethod === "creatorOnly"
                            ? "个人支付"
                            : "按比例收费"}
                      </strong>
                    </div>
                    {splitMethod !== "ratio" && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-olive">{splitMethod === "equal" ? "人均金额" : "个人金额"}</span>
                        <strong className="text-deep-olive">
                          {splitMethod === "equal"
                            ? (Number(expenseAmount) / Math.max(state.members.length, 1)).toFixed(2)
                            : Number(expenseAmount).toFixed(2)}
                          元
                        </strong>
                      </div>
                    )}
                    {splitMethod === "ratio" && (
                      <div className="space-y-1 rounded-[18px] bg-white/55 px-3 py-2">
                        {state.members
                          .map((member) => ({
                            name: member.name,
                            ratio: Number(splitRatios[member.name] || 0) || 0,
                          }))
                          .filter((share) => share.ratio > 0)
                          .map((share) => (
                            <div key={share.name} className="flex justify-between gap-3">
                              <span className="text-muted-olive">{share.name} · {share.ratio}%</span>
                              <strong className="text-deep-olive">
                                {(Number(expenseAmount) * share.ratio / 100).toFixed(2)}元
                              </strong>
                            </div>
                          ))}
                      </div>
                    )}
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
