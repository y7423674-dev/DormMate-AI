"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon, { type AppIconName } from "@/components/AppIcon";

const tabs: { label: string; href: string; icon: AppIconName }[] = [
  { label: "首页", href: "/dashboard", icon: "home" },
  { label: "值扫", href: "/duty", icon: "broom" },
  { label: "缴费", href: "/payment", icon: "wallet" },
  { label: "洗晒", href: "/laundry", icon: "shirt" },
  { label: "我的", href: "/profile", icon: "user" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/70 bg-white/72 shadow-[0_-16px_40px_rgba(77,87,69,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[430px] px-2 py-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 rounded-[18px] py-1.5 text-center text-sm font-bold transition ${
                active
                  ? "bg-[#20251E] text-white shadow-[0_12px_24px_rgba(32,37,30,0.16)]"
                  : "text-[#6F766A] hover:bg-[#EEF5E8] hover:text-[#1F241E]"
              }`}
            >
              <span className={`mx-auto icon-badge-sm ${active ? "icon-badge-dark" : ""}`}>
                <AppIcon name={tab.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="mt-0.5 block text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
