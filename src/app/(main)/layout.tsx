"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import BottomNav from "@/components/BottomNav";
import AiBubble from "@/components/AiBubble";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { session, authReady } = useDorm();
  const router = useRouter();
  const pathname = usePathname();
  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (authReady && !session) {
      router.push("/");
    }
  }, [authReady, session, router]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  if (!authReady || !session) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#F3F6EF] px-4 text-[#1F241E]">
        <div className="w-full max-w-[360px] rounded-[24px] border border-white/75 bg-white/80 px-5 py-4 text-center shadow-[0_18px_48px_rgba(77,87,69,0.14)]">
          <p className="text-sm font-extrabold text-[#4F5844]">
            {!authReady ? "正在加载宿舍数据..." : "正在返回登录页..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#F3F6EF] px-2 py-2 text-[#1F241E]">
      <div className="relative mx-auto h-[calc(100dvh-16px)] w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/70 bg-[#F8FAF5] shadow-[0_22px_62px_rgba(77,87,69,0.16)]">
        <div className="pointer-events-none absolute left-[-72px] top-[-84px] h-48 w-48 rounded-full bg-[#DCEFC5]/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-[-92px] h-52 w-52 rounded-full bg-white/80 blur-3xl" />
        <main
          ref={mainScrollRef}
          id="main-scroll-container"
          className="absolute inset-0 z-10 overflow-y-auto overscroll-contain px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 [-webkit-overflow-scrolling:touch]"
        >
          {children}
        </main>
        <BottomNav />
        <AiBubble />
      </div>
    </div>
  );
}
