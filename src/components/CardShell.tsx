"use client";

import type { ReactNode } from "react";

export default function CardShell({
  variant = "bordered",
  title,
  children,
  className = "",
}: {
  variant?: "bordered" | "sage";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const base = variant === "sage" ? "card-sage" : "card-bordered";
  return (
    <div className={`${base} mb-3 p-4 ${className}`}>
      {title && <h3 className="mb-2.5 text-[15px] font-extrabold tracking-[-0.01em] text-[#1F241E]">{title}</h3>}
      {children}
    </div>
  );
}
