import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userName, slotIndex } = await request.json();

  const state = await loadServerDormState(code);
  if (slotIndex === undefined || slotIndex === "") {
    const hasUserSlots = state.balcony.slots.some((slot) => slot.user === userName);
    if (!hasUserSlots) {
      return NextResponse.json({ error: "没有可收取的晾晒记录" }, { status: 404 });
    }

    state.balcony = {
      ...state.balcony,
      slots: state.balcony.slots.filter((slot) => slot.user !== userName),
    };
    await saveServerDormState(state);
    return NextResponse.json(state);
  }

  const targetIndex =
    Number(slotIndex);

  if (
    !Number.isInteger(targetIndex) ||
    !state.balcony.slots[targetIndex] ||
    state.balcony.slots[targetIndex].user !== userName
  ) {
    return NextResponse.json({ error: "没有可收取的晾晒记录" }, { status: 404 });
  }

  state.balcony = {
    ...state.balcony,
    slots: state.balcony.slots.filter((_, index) => index !== targetIndex),
  };
  await saveServerDormState(state);
  return NextResponse.json(state);
}