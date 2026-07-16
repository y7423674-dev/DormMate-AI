import type { DormState } from "@/data/types";

export const DORM_MEMBER_LIMIT = 4;

export function addOrUpdateDormMember(
  state: DormState,
  nickname: string,
  role: "member" | "leader"
): string | null {
  const cleanNickname = nickname.trim();
  if (!cleanNickname) return "昵称不能为空";

  const existingLeader = state.members.find(
    (member) => member.role === "leader" && member.name !== cleanNickname
  );
  if (role === "leader" && existingLeader) {
    return `舍长身份已被 ${existingLeader.name} 占用，请以舍友身份加入`;
  }

  const existingIndex = state.members.findIndex((member) => member.name === cleanNickname);
  if (existingIndex === -1) {
    if (state.members.length >= DORM_MEMBER_LIMIT) {
      return `宿舍人数已满，最多登记 ${DORM_MEMBER_LIMIT} 人`;
    }

    state.members.push({
      id: String(state.members.length + 1),
      name: cleanNickname,
      role,
      status: "",
      avatarInitial: cleanNickname.slice(-1),
    });
    return null;
  }

  state.members[existingIndex] = {
    ...state.members[existingIndex],
    role,
  };
  return null;
}

export function renameDormMember(state: DormState, oldName: string, newName: string): string | null {
  const cleanNewName = newName.trim();
  if (!cleanNewName) return "昵称不能为空";

  const memberIndex = state.members.findIndex((member) => member.name === oldName);
  if (memberIndex === -1) return "未找到当前成员";

  const duplicate = state.members.some((member) => member.name === cleanNewName && member.name !== oldName);
  if (duplicate) return "该昵称已被舍友使用";

  state.members[memberIndex] = {
    ...state.members[memberIndex],
    name: cleanNewName,
    avatarInitial: cleanNewName.slice(-1),
  };

  if (state.todayDuty.user === oldName) {
    state.todayDuty = {
      ...state.todayDuty,
      user: cleanNewName,
    };
  }

  state.dutySchedule = state.dutySchedule.map((day) => ({
    ...day,
    user: day.user === oldName ? cleanNewName : day.user,
  }));

  state.balcony = {
    ...state.balcony,
    slots: state.balcony.slots.map((slot) => ({
      ...slot,
      user: slot.user === oldName ? cleanNewName : slot.user,
    })),
  };

  state.announcements = state.announcements.map((announcement) => ({
    ...announcement,
    author: announcement.author === oldName ? cleanNewName : announcement.author,
  }));

  state.expenses = state.expenses.map((expense) => ({
    ...expense,
    creator: expense.creator === oldName ? cleanNewName : expense.creator,
    confirmations: expense.confirmations.map((confirmation) => ({
      ...confirmation,
      member: confirmation.member === oldName ? cleanNewName : confirmation.member,
    })),
    splitShares: expense.splitShares?.map((share) => ({
      ...share,
      member: share.member === oldName ? cleanNewName : share.member,
    })),
  }));

  return null;
}

export function syncDormMemberDerivedState(state: DormState): void {
  const memberNames = state.members.map((member) => member.name);
  const memberCount = Math.max(state.members.length, 1);

  if (!memberNames.includes(state.todayDuty.user) && state.members[0]) {
    state.todayDuty = {
      ...state.todayDuty,
      user: state.members[0].name,
    };
  }

  state.utility = {
    ...state.utility,
    memberCount,
    perPerson: Math.round((state.utility.total / memberCount) * 100) / 100,
    confirmedCount: Math.min(state.utility.confirmedCount, state.members.length),
  };

  state.announcements = state.announcements.map((announcement) => ({
    ...announcement,
    totalMembers: state.members.length,
    readCount: Math.min(announcement.readCount, state.members.length),
  }));

  state.expenses = state.expenses.map((expense) => {
    const confirmationsByMember = new Map(
      expense.confirmations.map((confirmation) => [confirmation.member, confirmation])
    );

    return {
      ...expense,
      perPerson: expense.splitShares
        ? expense.perPerson
        : Math.round((expense.amount / memberCount) * 100) / 100,
      confirmations: memberNames.map((member) => ({
        member,
        confirmed: confirmationsByMember.get(member)?.confirmed || member === expense.creator,
        status: confirmationsByMember.get(member)?.status || (member === expense.creator ? "confirmed" : "unpaid"),
        submittedAt: confirmationsByMember.get(member)?.submittedAt,
      })),
    };
  });
}
