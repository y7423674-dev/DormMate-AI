"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import BottomNav from "@/components/BottomNav";
import AiBubble from "@/components/AiBubble";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { session } = useDorm();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#F3F6EF] px-2 py-2 text-[#1F241E]">
      <div className="relative mx-auto min-h-[calc(100vh-16px)] w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/70 bg-[#F8FAF5] shadow-[0_22px_62px_rgba(77,87,69,0.16)]">
        <div className="pointer-events-none absolute left-[-72px] top-[-84px] h-48 w-48 rounded-full bg-[#DCEFC5]/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-[-92px] h-52 w-52 rounded-full bg-white/80 blur-3xl" />
        <main className="relative z-10 px-3 pb-24 pt-3">{children}</main>
        <BottomNav />
        <AiBubble />
      </div>
    </div>
  );
}
