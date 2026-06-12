"use client";

const variantStyles: Record<string, string> = {
  success: "bg-[#E4E9D7] text-[#465038]",
  warning: "bg-[#EFE3CC] text-[#6B5734]",
  danger: "bg-[#F2DDD5] text-[#7C3D2F]",
  default: "bg-[#EEF0E4] text-[#5F6654]",
};

export default function StatusBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: string;
}) {
  return (
    <span className={`badge-pill ${variantStyles[variant] || variantStyles.default}`}>
      {label}
    </span>
  );
}
