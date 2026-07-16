"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";

type AuthMode = "login" | "register";

function createDormCode() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DORM-${suffix}`;
}

export default function AuthPage() {
  const router = useRouter();
  const { authReady, session, login, register } = useDorm();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dormCode, setDormCode] = useState("");
  const [role, setRole] = useState<"member" | "leader">("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && session) {
      router.replace("/dashboard");
    }
  }, [authReady, session, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = username.trim();
    const cleanDormCode = dormCode.trim();

    if (!cleanUsername) {
      setError("请输入昵称");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }
    if (mode === "register" && !cleanDormCode) {
      setError("请输入宿舍邀请码");
      return;
    }

    setError("");
    setLoading(true);
    const authError =
      mode === "login"
        ? await login({ username: cleanUsername, password })
        : await register({ username: cleanUsername, password, dormCode: cleanDormCode, role });
    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    if (nextMode === "register" && !dormCode.trim()) {
      setDormCode(createDormCode());
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F6EF] px-2.5 py-2.5 text-[#1F241E]">
      <section className="mx-auto flex min-h-[calc(100vh-20px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[#F8FAF5] px-5 pb-5 pt-5 shadow-[0_24px_68px_rgba(77,87,69,0.17)]">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/75 text-lg font-black text-[#61734D] shadow-[0_12px_24px_rgba(96,114,76,0.13)]">
              :)
            </div>
            <div>
              <p className="text-[21px] font-extrabold leading-tight text-[#1F241E]">DormMate AI</p>
              <p className="mt-0.5 text-xs font-semibold text-[#7B8375]">宿舍协作看板</p>
            </div>
          </div>
          <span className="rounded-full bg-[#EAF3E2] px-3 py-1.5 text-xs font-extrabold text-[#61734D]">
            {mode === "login" ? "登录" : "注册"}
          </span>
        </header>

        <div className="mb-5">
          <h1 className="text-[28px] font-extrabold leading-[1.08] text-[#1F241E]">
            {mode === "login" ? "欢迎回来" : "创建宿舍账号"}
          </h1>
          <p className="mt-2.5 max-w-[340px] text-[15px] font-medium leading-6 text-[#6F766A]">
            {mode === "login"
              ? "使用昵称和密码进入你的宿舍空间。"
              : "注册后会自动加入对应宿舍，并保存你的身份。"}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-full border border-[#E3E8DD] bg-[#EEF3E8]/90 p-1.5">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
              mode === "login"
                ? "bg-[#20251E] text-white shadow-[0_12px_24px_rgba(32,37,30,0.18)]"
                : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
              mode === "register"
                ? "bg-[#20251E] text-white shadow-[0_12px_24px_rgba(32,37,30,0.18)]"
                : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/75 bg-white/72 p-4 shadow-[0_20px_52px_rgba(82,94,72,0.15)]">
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#3A4035]" htmlFor="username">
                昵称
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="例如：小李"
                className="input-default py-3"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#3A4035]" htmlFor="password">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                className="input-default py-3"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#3A4035]" htmlFor="dormCode">
                    宿舍邀请码
                  </label>
                  <input
                    id="dormCode"
                    type="text"
                    value={dormCode}
                    onChange={(event) => setDormCode(event.target.value)}
                    placeholder="例如：DORM-402"
                    className="input-default py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#3A4035]">身份</label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-full border border-[#E3E8DD] bg-[#EEF3E8]/90 p-1.5">
                    <button
                      type="button"
                      onClick={() => setRole("member")}
                      className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
                        role === "member"
                          ? "bg-[#20251E] text-white shadow-[0_12px_24px_rgba(32,37,30,0.18)]"
                          : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
                      }`}
                    >
                      舍友
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("leader")}
                      className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
                        role === "leader"
                          ? "bg-[#20251E] text-white shadow-[0_12px_24px_rgba(32,37,30,0.18)]"
                          : "text-[#6F766A] hover:bg-white/70 hover:text-[#1F241E]"
                      }`}
                    >
                      舍长
                    </button>
                  </div>
                  <p className="mt-2 rounded-[16px] bg-[#F6F8F2] px-3 py-2 text-xs font-medium leading-5 text-[#6F766A]">
                    注：舍长可以删除缴费记录、管理宿舍成员身份、发起宿舍公共事项。
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="rounded-[18px] border border-[#E8D6BF] bg-[#FFF8ED] px-4 py-3 text-sm font-bold text-[#8A5A25]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !authReady}
              className="w-full rounded-[18px] bg-[#20251E] px-5 py-3.5 text-center text-[15px] font-extrabold text-white shadow-[0_16px_32px_rgba(32,37,30,0.23)] transition hover:bg-[#30372D] disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none active:scale-[0.99]"
            >
              {loading ? "处理中..." : mode === "login" ? "登录并进入" : "注册并进入"}
            </button>
          </div>
        </form>

      </section>
    </main>
  );
}
