import type { DormState } from "@/data/types";
import { createDefaultDormState } from "@/data/mock";
import { getSupabase } from "@/lib/supabase";
import type { Json } from "@/lib/supabase";

function normalizeDormState(state: DormState): DormState {
  state.leaderTransferRequests ||= [];
  state.expenses = state.expenses.map((expense) => ({
    ...expense,
    confirmations: expense.confirmations.map((confirmation) => ({
      ...confirmation,
      status: confirmation.status || (confirmation.confirmed ? "confirmed" : "unpaid"),
    })),
  }));
  return state;
}

export async function getDormState(dormCode: string): Promise<DormState | null> {
  const { data, error } = await getSupabase()
    .from("dorm_states")
    .select("state_json")
    .eq("dorm_code", dormCode)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return normalizeDormState(data.state_json as unknown as DormState);
}

export async function saveDormState(dormCode: string, state: DormState): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await getSupabase()
    .from("dorm_states")
    .upsert(
      {
        id: `dorm-state-${dormCode}`,
        dorm_code: dormCode,
        state_json: state as unknown as Json,
        updated_at: now,
      },
      { onConflict: "dorm_code" }
    );

  if (error) throw error;
}

export async function loadServerDormState(dormCode: string): Promise<DormState> {
  const state = await getDormState(dormCode);
  if (state) return state;

  const defaultState = createDefaultDormState(dormCode);
  await saveDormState(dormCode, defaultState);
  return defaultState;
}

export async function saveServerDormState(state: DormState): Promise<void> {
  await saveDormState(state.dormCode, state);
}
