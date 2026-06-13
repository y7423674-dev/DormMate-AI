"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import { defaultDormCode } from "@/data/mock";

export default function JoinPage() {
  const router = useRouter();
  const { joinDorm } = useDorm();
  const [nickname, setNickname] = useState("");
  const [dormCode, setDormCode] = useState(defaultDormCode);
  const [role, setRole] = useState<"member" | "leader">("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const clearData = async () => {
    const code = dormCode.trim() || defaultDormCode;
    setResetting(true);
    setError("");
    try {
      await fetch(`/api/dorm/${code}/reset`, { method: "POST" });
      localStorage.removeItem("dormmate_dorm_state");
      localStorage.removeItem("dormmate_user_session");
      sessionStorage.clear();
      window.location.reload();
    } catch {
      setError("恢复初始状态失败，请稍后再试");
      setResetting(false);
    }
  };

  async function handleJoin() {
    if (!nickname.trim()) {
      setError("昵称不能为空");
      return;
    }
    if (!dormCode.trim()) {
      setError("宿舍邀请码不能为空");
      return;
    }
    setError("");
    setLoading(true);
    const joinError = await joinDorm(nickname.trim(), dormCode.trim(), role);
    setLoading(false);
    if (joinError) {
      setError(joinError);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#F3F6EF] px-2.5 py-2.5 text-[#1F241E]">
      <section className="mx-auto min-h-[calc(100vh-20px)] w-full max-w-[430px] overflow-hidden rounded-[32px] border border-white/70 bg-[#F8FAF5] shadow-[0_24px_68px_rgba(77,87,69,0.17)]">
        <div className="relative flex min-h-[calc(100vh-20px)] flex-col px-5 pb-3.5 pt-4.5">
          <div className="pointer-events-none absolute left-[-72px] top-[-84px] h-52 w-52 rounded-full bg-[#DCEFC5]/58 blur-3xl" />
          <div className="pointer-events-none absolute bottom-16 right-[-92px] h-56 w-56 rounded-full bg-white/80 blur-3xl" />

          <header className="relative z-10 mb-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/70 text-lg font-black text-[#61734D] shadow-[0_12px_24px_rgba(96,114,76,0.13)] backdrop-blur">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.9"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                  <path d="M8.5 10h.1" />
                  <path d="M15.5 10h.1" />
                  <path d="M8.5 14.5c1.8 2 5.2 2 7 0" />
                </svg>
              </div>
              <div>
                <p className="text-[21px] font-extrabold leading-tight tracking-[-0.01em] text-[#1F241E]">
                  DormMate AI
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#7B8375]">V0.1 Demo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearData}
              disabled={resetting}
              className="rounded-full border border-[#E3E8DD] bg-white/60 px-3 py-2 text-[11px] font-bold text-[#6F766A] shadow-[0_8px_18px_rgba(86,96,76,0.08)] backdrop-blur transition hover:bg-[#EEF5E8] hover:text-[#1F241E] active:scale-[0.98]"
            >
              {resetting ? "恢复中..." : "恢复初始状态"}
            </button>
          </header>

          <div className="relative z-10 mb-4">
            <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.01em] text-[#1F241E]">
              AI 宿舍协作看板
            </h1>
            <p className="mt-2.5 max-w-[330px] text-[15px] font-medium leading-6 text-[#6F766A]">
              AI 宿舍协作看板，让宿舍生活更轻松。
            </p>
          </div>

          <div className="relative z-10 rounded-[28px] border border-white/75 bg-white/70 p-4.5 shadow-[0_20px_52px_rgba(82,94,72,0.15)] backdrop-blur-xl">
            <div className="mb-3.5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#8BA66D]">
                  Join Space
                </p>
                <h2 className="mt-1 text-[23px] font-extrabold tracking-[-0.01em] text-[#1F241E]">
                  加入宿舍空间
                </h2>
              </div>
              <span className="rounded-full bg-[#EAF3E2] px-3 py-1.5 text-xs font-extrabold text-[#61734D]">
                {defaultDormCode}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#3A4035]">你的昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：小李"
                  className="w-full rounded-[21px] border border-[#E3E8DD] bg-[#F6F8F2]/90 px-4 py-3 text-[15px] font-semibold text-[#1F241E] outline-none transition placeholder:text-[#A4AA9E] focus:border-[#A7D86D] focus:bg-white focus:shadow-[0_0_0_5px_rgba(167,216,109,0.18)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#3A4035]">宿舍邀请码</label>
                <input
                  type="text"
                  value={dormCode}
                  onChange={(e) => setDormCode(e.target.value)}
                  placeholder="例如：DORM-402"
                  className="w-full rounded-[21px] border border-[#E3E8DD] bg-[#F6F8F2]/90 px-4 py-3 text-[15px] font-semibold text-[#1F241E] outline-none transition placeholder:text-[#A4AA9E] focus:border-[#A7D86D] focus:bg-white focus:shadow-[0_0_0_5px_rgba(167,216,109,0.18)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#3A4035]">你的身份</label>
                <div className="grid grid-cols-2 gap-1.5 rounded-full border border-[#E3E8DD] bg-[#EEF3E8]/90 p-1.5">
                  <button
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
              </div>

              {error && (
                <p className="rounded-[20px] border border-[#E8D6BF] bg-[#FFF8ED] px-4 py-3 text-sm font-bold text-[#8A5A25]">
                  {error}
                </p>
              )}

              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full rounded-[21px] bg-[#20251E] px-5 py-3.5 text-center text-[15px] font-extrabold text-white shadow-[0_16px_32px_rgba(32,37,30,0.23)] transition hover:bg-[#30372D] disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none active:scale-[0.99]"
              >
                {loading ? "加入中..." : "进入宿舍空间"}
              </button>
            </div>
          </div>

          <p className="relative z-10 mt-auto pt-3.5 text-center text-[11px] font-semibold text-[#8A9285]">
            原型 Demo · 不做登录注册 · 数据仅存储在服务端
          </p>
        </div>
      </section>
    </main>
  );
}
