import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userName, slotIndex } = await request.json();

  const state = loadServerDormState(code);
  const targetIndex =
    slotIndex === undefined || slotIndex === ""
      ? state.balcony.slots.findIndex((slot) => slot.user === userName)
      : Number(slotIndex);

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
  saveServerDormState(state);
  return NextResponse.json(state);
}
