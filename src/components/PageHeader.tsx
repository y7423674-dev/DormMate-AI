"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export default function PageHeader({
  title,
  showBack = false,
  backHref = "/dashboard",
  rightContent,
}: {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightContent?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-3 mb-3 border-b border-white/60 bg-[#F8FAF5]/78 px-3 py-2.5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <Link href={backHref} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-[#5E6650] shadow-[0_8px_20px_rgba(86,96,76,0.08)] transition-colors hover:text-[#1F241E] font-bold">
              ←
            </Link>
          )}
          <h1 className="text-lg font-extrabold tracking-[-0.01em] text-[#1F241E]">{title}</h1>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </header>
  );
}
