import type { DormState } from "@/data/types";
import { createDefaultDormState } from "@/data/mock";

// In-memory store: data persists across page refreshes but resets on server restart
const store = new Map<string, DormState>();

export function loadServerDormState(dormCode: string): DormState {
  const existing = store.get(dormCode);
  if (existing) return existing;
  const state = createDefaultDormState(dormCode);
  store.set(dormCode, state);
  return state;
}

export function saveServerDormState(state: DormState): void {
  store.set(state.dormCode, state);
}