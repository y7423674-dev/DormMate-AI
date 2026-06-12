import type { DormState, UserSession } from "@/data/types";

const DORM_STATE_KEY = "dormmate_dorm_state";
const USER_SESSION_KEY = "dormmate_user_session";

export function loadDormState(dormCode: string): DormState | null {
  const raw = localStorage.getItem(DORM_STATE_KEY);
  if (!raw) return null;
  try {
    const state: DormState = JSON.parse(raw);
    return state.dormCode === dormCode ? state : null;
  } catch {
    return null;
  }
}

export function saveDormState(state: DormState): void {
  localStorage.setItem(DORM_STATE_KEY, JSON.stringify(state));
}

export function loadUserSession(): UserSession | null {
  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserSession(session: UserSession): void {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export function clearAll(): void {
  localStorage.removeItem(DORM_STATE_KEY);
  localStorage.removeItem(USER_SESSION_KEY);
}