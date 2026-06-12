export type AppIconName =
  | "home"
  | "broom"
  | "wallet"
  | "shirt"
  | "user"
  | "bell"
  | "pin"
  | "check"
  | "sun"
  | "cloudSun"
  | "rain"
  | "sparkles";

type AppIconProps = {
  name: AppIconName;
  className?: string;
};

const paths: Record<AppIconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  broom: (
    <>
      <path d="M15.5 3.5 9 10" />
      <path d="m8 11 5 5" />
      <path d="M5.5 13.5 9 10l5 5-3.5 3.5c-2.3-.2-4.2-2-5-5Z" />
      <path d="M4 20h8.5" />
      <path d="m6 16.5-1.3 2.8" />
      <path d="m8.2 18-1 2" />
      <path d="m10.2 18.6-.5 1.4" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5h14.5A2.5 2.5 0 0 1 21 10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a1 1 0 0 1 1-1Z" />
      <path d="M6 7.5 16.5 4 18 7.5" />
      <path d="M15.5 13.5H21v4h-5.5a2 2 0 0 1 0-4Z" />
      <path d="M17 15.5h.1" />
    </>
  ),
  shirt: (
    <>
      <path d="M9 4h6l2.5 2 3 1.5-2 4-2-1V20h-9V10.5l-2 1-2-4 3-1.5L9 4Z" />
      <path d="M9 4c.5 1.5 1.5 2.3 3 2.3S14.5 5.5 15 4" />
    </>
  ),
  user: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20c1.5-3.5 4-5.2 7.5-5.2s6 1.7 7.5 5.2" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 17h11l-1.2-2.1V10a4.3 4.3 0 0 0-8.6 0v4.9L6.5 17Z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      <path d="M12 4V3" />
    </>
  ),
  pin: (
    <>
      <path d="M14.5 4.5 19.5 9.5" />
      <path d="M9 10 14 5l5 5-5 5" />
      <path d="M5 19 12 12" />
      <path d="M8.5 9.5 14.5 15.5" />
    </>
  ),
  check: (
    <>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </>
  ),
  sun: (
    <>
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M12 2.5v2" />
      <path d="M12 19.5v2" />
      <path d="M4.6 4.6 6 6" />
      <path d="m18 18 1.4 1.4" />
      <path d="M2.5 12h2" />
      <path d="M19.5 12h2" />
      <path d="M4.6 19.4 6 18" />
      <path d="M18 6l1.4-1.4" />
    </>
  ),
  cloudSun: (
    <>
      <path d="M8 17.5h9a3 3 0 0 0 .4-6 5 5 0 0 0-9.6 1.2A2.5 2.5 0 0 0 8 17.5Z" />
      <path d="M6.5 8.5a3 3 0 0 1 4-4" />
      <path d="M4 5.5l1.1 1.1" />
      <path d="M9 2.5V4" />
    </>
  ),
  rain: (
    <>
      <path d="M7.5 14h9a3 3 0 0 0 .4-6 5 5 0 0 0-9.6 1.2A2.5 2.5 0 0 0 7.5 14Z" />
      <path d="m8 17-1 2" />
      <path d="m12 17-1 2" />
      <path d="m16 17-1 2" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.7 8l4.3 1.7-4.3 1.7L12 16l-1.7-4.6L6 9.7 10.3 8 12 3.5Z" />
      <path d="M5 14.5 5.8 17 8 18l-2.2.9L5 21.5l-.8-2.6L2 18l2.2-1L5 14.5Z" />
      <path d="M18.5 14 19 16l2 0.5-2 .7-.5 1.8-.7-1.8-1.8-.7 1.8-.5.7-2Z" />
    </>
  ),
};

export default function AppIcon({ name, className = "h-5 w-5" }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
import type { ReactNode } from "react";
