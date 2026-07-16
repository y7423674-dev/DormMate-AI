"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { DormState, UserSession } from "@/data/types";
import { loadUserSession, saveUserSession } from "@/lib/storage";
import { broadcastStateUpdate, initBroadcast, closeBroadcast } from "@/lib/broadcast";

type AuthPayload = {
  username: string;
  password: string;
  dormCode?: string;
  role?: "member" | "leader";
};

type DormContextType = {
  state: DormState | null;
  session: UserSession | null;
  authReady: boolean;
  login: (payload: AuthPayload) => Promise<string | null>;
  register: (payload: Required<AuthPayload>) => Promise<string | null>;
  joinDorm: (nickname: string, dormCode: string, role: "member" | "leader") => Promise<string | null>;
  updateNickname: (nickname: string) => Promise<string | null>;
  refreshState: () => Promise<void>;
  apiPost: (path: string, body: Record<string, unknown>) => Promise<string | null>;
  sendAiMessage: (message: string) => Promise<string>;
  clearSession: () => Promise<void>;
};

const DormContext = createContext<DormContextType | null>(null);

export function useDorm() {
  const ctx = useContext(DormContext);
  if (!ctx) throw new Error("useDorm must be used within DormProvider");
  return ctx;
}

export function DormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DormState | null>(null);
  const [session, setSession] = useState<UserSession | null>(() =>
    typeof window === "undefined" ? null : loadUserSession()
  );
  const [authReady, setAuthReady] = useState(false);
  const dormCode = state?.dormCode;
  const effectiveSession = session && state
    ? {
      ...session,
      role: state.members.find((member) => member.name === session.nickname)?.role || session.role,
    }
    : session;

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.session) {
          setSession(data.session as UserSession);
          setState(data.state as DormState);
          saveUserSession(data.session as UserSession);
        } else {
          setSession(null);
          setState(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dormCode) return;
    initBroadcast((remoteState) => {
      setState(remoteState);
    });
    return () => {
      closeBroadcast();
    };
  }, [dormCode]);

  useEffect(() => {
    if (!authReady || !session || state) return;

    let cancelled = false;
    fetch(`/api/dorm/${session.dormCode}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) {
          setState(data as DormState);
          broadcastStateUpdate(data as DormState);
        }
      })
      .catch(() => {
        // keep the authenticated shell mounted; pages can show their own empty state
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, session, state]);

  const applyAuthResponse = useCallback(async (res: Response): Promise<string | null> => {
    const data = await res.json();
    if (!res.ok) {
      return String(data.error || "操作失败，请稍后再试");
    }

    const nextSession = data.session as UserSession;
    const nextState = data.state as DormState;
    setSession(nextSession);
    setState(nextState);
    saveUserSession(nextSession);
    broadcastStateUpdate(nextState);
    return null;
  }, []);

  const login = useCallback(async (payload: AuthPayload) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return applyAuthResponse(res);
    } catch {
      return "登录失败，请稍后再试";
    }
  }, [applyAuthResponse]);

  const register = useCallback(async (payload: Required<AuthPayload>) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return applyAuthResponse(res);
    } catch {
      return "注册失败，请稍后再试";
    }
  }, [applyAuthResponse]);

  const updateNickname = useCallback(async (nickname: string) => {
    try {
      const res = await fetch("/api/auth/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      return applyAuthResponse(res);
    } catch {
      return "修改昵称失败，请稍后再试";
    }
  }, [applyAuthResponse]);

  const refreshState = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/dorm/${session.dormCode}`);
      const data = await res.json();
      setState(data as DormState);
      broadcastStateUpdate(data);
    } catch {
      // ignore transient refresh errors
    }
  }, [session]);

  const apiPost = useCallback(async (path: string, body: Record<string, unknown>) => {
    if (!session) return "请先登录";
    try {
      const res = await fetch(`/api/dorm/${session.dormCode}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return String(data.error || "操作失败，请稍后再试");
      }

      const nextState = (data.state || data) as DormState;
      if (data.session) {
        const nextSession = data.session as UserSession;
        setSession(nextSession);
        saveUserSession(nextSession);
      }
      setState(nextState);
      broadcastStateUpdate(nextState);
      return null;
    } catch {
      return "操作失败，请稍后再试";
    }
  }, [session]);

  const joinDorm = useCallback(async (nickname: string, dormCode: string, role: "member" | "leader") => {
    try {
      const res = await fetch(`/api/dorm/${dormCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return String(data.error || "加入宿舍失败");
      }
      const savedMember = (data as DormState).members.find((member) => member.name === nickname);
      const savedRole = savedMember?.role || role;
      const newSession: UserSession = { nickname, dormCode, role: savedRole };
      setSession(newSession);
      setState(data as DormState);
      saveUserSession(newSession);
      broadcastStateUpdate(data);
      return null;
    } catch {
      return "加入宿舍失败，请稍后再试";
    }
  }, []);

  const sendAiMessage = useCallback(async (message: string): Promise<string> => {
    if (!session) return "";
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dormCode: session.dormCode, userName: session.nickname, message }),
      });
      const data = await res.json();
      setState(data.state as DormState);
      broadcastStateUpdate(data.state);
      return data.reply as string;
    } catch {
      return "";
    }
  }, [session]);

  const clearSession = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // local cleanup still applies
    }
    setSession(null);
    setState(null);
    localStorage.removeItem("dormmate_user_session");
  }, []);

  return (
    <DormContext.Provider
      value={{
        state,
        session: effectiveSession,
        authReady,
        login,
        register,
        joinDorm,
        updateNickname,
        refreshState,
        apiPost,
        sendAiMessage,
        clearSession,
      }}
    >
      {children}
    </DormContext.Provider>
  );
}
