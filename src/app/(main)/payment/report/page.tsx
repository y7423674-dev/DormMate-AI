"use client";

import { useDorm } from "@/app/DormProvider";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = {
  barFill: "#A7D86D",
  barHover: "#8BCF5A",
  axis: "#9ea096",
  grid: "#eeefe9",
  axisLine: "#bfc1b7",
};

export default function ReportPage() {
  const { state } = useDorm();
  if (!state) return null;

  const stats = state.monthlyStats;
  const payableExpenses = state.expenses.filter((expense) => expense.splitMethod !== "个人支付");

  const expenseBreakdownData = stats.expenseBreakdown;
  const weeklyExpenseData = stats.weeklyExpenses;

  const suggestions = [
    "建议水电费固定在月初记录，避免月底遗漏。",
    "公共用品可以统一采购一次，减少多次小额支出。",
    "月底前提醒未完成舍友确认缴费，减少催收压力。",
  ];

  return (
    <div>
      <PageHeader title="6月AI费用报表" showBack backHref="/payment" />

      {/* AI Summary */}
      <CardShell variant="sage" title="AI 月度总结">
        <p className="text-sm text-olive-ink leading-relaxed">
          本月共记录 8 笔支出，合计{stats.utilityTotal}元，人均{Math.round(stats.utilityTotal / state.members.length)}元。
          支出主要集中在水电费，公共用品支出较低。
        </p>
        <button className="btn-sage text-sm mt-3">重新生成AI分析</button>
      </CardShell>

      {/* Expense Breakdown Chart */}
      <CardShell title="费用结构图">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={expenseBreakdownData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis type="number" tick={{ fill: CHART_COLORS.axis, fontSize: 13 }} axisLine={{ stroke: CHART_COLORS.axisLine }} />
            <YAxis type="category" dataKey="category" tick={{ fill: CHART_COLORS.axis, fontSize: 13 }} axisLine={{ stroke: CHART_COLORS.axisLine }} width={80} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #E3E8DD",
                borderRadius: "16px",
                color: "#4d4f46",
                fontSize: 13,
              }}
            />
            <Bar dataKey="amount" fill={CHART_COLORS.barFill} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-olive mt-3 leading-relaxed">
          AI解释：水电费占本月支出主体（128元），公共用品支出仅46元，建议减少零散采购。
        </p>
      </CardShell>

      {/* Weekly Trend Chart */}
      <CardShell title="每周支出趋势">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyExpenseData}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="week" tick={{ fill: CHART_COLORS.axis, fontSize: 13 }} axisLine={{ stroke: CHART_COLORS.axisLine }} />
            <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 13 }} axisLine={{ stroke: CHART_COLORS.axisLine }} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #E3E8DD",
                borderRadius: "16px",
                color: "#4d4f46",
                fontSize: 13,
              }}
            />
            <Bar dataKey="amount" fill={CHART_COLORS.barFill} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-olive mt-3 leading-relaxed">
          AI解释：第3周支出最高（72元），因电费和公共用品集中采购。第4周最低（14元）。
        </p>
      </CardShell>

      {/* Roommate Completion */}
      <CardShell variant="sage" title="舍友完成情况">
        <div className="space-y-2">
          {state.members.map((m) => {
            const allConfirmed = payableExpenses.every((exp) =>
              exp.confirmations.find((c) => c.member === m.name)?.confirmed
            );
            return (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-deep-olive">{m.name}</span>
                <StatusBadge label={allConfirmed ? "已完成" : "未完成"} variant={allConfirmed ? "success" : "warning"} />
              </div>
            );
          })}
        </div>
        <button className="btn-sage text-sm mt-3">提醒未完成舍友</button>
      </CardShell>

      {/* AI Suggestions */}
      <CardShell title="AI下月建议">
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="text-sm text-olive-ink leading-relaxed">
              <span className="font-bold text-[#6D8F3E]">{i + 1}.</span> {s}
            </div>
          ))}
        </div>
      </CardShell>
    </div>
  );
}
