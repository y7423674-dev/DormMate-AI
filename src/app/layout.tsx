import type { Metadata } from "next";
import "./globals.css";
import { DormProvider } from "./DormProvider";

export const metadata: Metadata = {
  title: "DormMate AI - AI 宿舍协作看板",
  description: "面向学生宿舍的 AI 协作管理工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F3F6EF] text-[#1F241E] font-sans">
        <DormProvider>
          {children}
        </DormProvider>
      </body>
    </html>
  );
}
