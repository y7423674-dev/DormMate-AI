import { NextRequest, NextResponse } from "next/server";
import { updateUserRole } from "@/lib/authStore";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import { getSession, setSession } from "@/lib/session";
import type { LeaderTransferRequest } from "@/data/types";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession();
  if (!session || session.dormCode !== code) {
    return jsonError("请先登录当前宿舍", 401);
  }

  const { action, targetMember, requestId } = await request.json();
  const state = loadServerDormState(code);
  const myMember = state.members.find((member) => member.name === session.nickname);
  if (!myMember) {
    return jsonError("未找到当前成员", 404);
  }

  state.leaderTransferRequests ||= [];

  if (action === "initiate") {
    const cleanTarget = String(targetMember || "").trim();
    if (myMember.role !== "leader") {
      return jsonError("只有舍长可以发起身份转换", 403);
    }
    if (!cleanTarget || cleanTarget === session.nickname) {
      return jsonError("请选择一名舍友", 400);
    }

    const target = state.members.find((member) => member.name === cleanTarget);
    if (!target) {
      return jsonError("未找到目标舍友", 404);
    }
    if (target.role === "leader") {
      return jsonError("目标已经是舍长", 409);
    }

    state.leaderTransferRequests = state.leaderTransferRequests.filter(
      (item) => item.from !== session.nickname && item.to !== cleanTarget
    );
    const transfer: LeaderTransferRequest = {
      id: `leader-transfer-${Date.now()}`,
      from: session.nickname,
      to: cleanTarget,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    state.leaderTransferRequests.push(transfer);
    saveServerDormState(state);
    return NextResponse.json(state);
  }

  const pending = state.leaderTransferRequests.find(
    (item) => item.id === requestId && item.status === "pending"
  );
  if (!pending) {
    return jsonError("未找到待处理的身份转换请求", 404);
  }

  if (action === "accept") {
    if (pending.to !== session.nickname) {
      return jsonError("只有被邀请的舍友可以同意转换", 403);
    }

    const fromIndex = state.members.findIndex((member) => member.name === pending.from);
    const toIndex = state.members.findIndex((member) => member.name === pending.to);
    if (fromIndex === -1 || toIndex === -1) {
      return jsonError("转换双方成员信息不完整", 409);
    }

    state.members = state.members.map((member) => {
      if (member.name === pending.from) return { ...member, role: "member" };
      if (member.name === pending.to) return { ...member, role: "leader" };
      return member;
    });
    state.leaderTransferRequests = state.leaderTransferRequests.filter((item) => item.id !== pending.id);

    await updateUserRole(pending.from, "member");
    const updatedTarget = await updateUserRole(pending.to, "leader");
    const nextSession = {
      ...session,
      role: updatedTarget?.role || "leader",
    };

    await setSession(nextSession);
    saveServerDormState(state);
    return NextResponse.json({ session: nextSession, state });
  }

  if (action === "reject") {
    if (pending.to !== session.nickname) {
      return jsonError("只有被邀请的舍友可以拒绝转换", 403);
    }
    state.leaderTransferRequests = state.leaderTransferRequests.filter((item) => item.id !== pending.id);
    saveServerDormState(state);
    return NextResponse.json(state);
  }

  if (action === "cancel") {
    if (pending.from !== session.nickname) {
      return jsonError("只有发起人可以取消转换", 403);
    }
    state.leaderTransferRequests = state.leaderTransferRequests.filter((item) => item.id !== pending.id);
    saveServerDormState(state);
    return NextResponse.json(state);
  }

  return jsonError("未知操作", 400);
}
