import type { DormState } from "@/data/types";
import { createDefaultDormState } from "@/data/mock";
import { getDatabase } from "@/lib/database";

type DormStateRow = {
  state_json: string;
};

export function loadServerDormState(dormCode: string): DormState {
  const db = getDatabase();
  const row = db
    .prepare("SELECT state_json FROM dorm_states WHERE dorm_code = ?")
    .get(dormCode) as DormStateRow | undefined;

  if (row) {
    const state = JSON.parse(row.state_json) as DormState;
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

  const state = createDefaultDormState(dormCode);
  saveServerDormState(state);
  return state;
}

export function saveServerDormState(state: DormState): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO dorm_states (dorm_code, state_json, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(dorm_code) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = datetime('now')
  `).run(state.dormCode, JSON.stringify(state));
}
